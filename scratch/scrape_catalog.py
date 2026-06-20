import urllib.request
import json
import urllib.parse
import re
import time
import html
import os

# Target search terms to sweep the catalog completely
SEARCH_QUERIES = [
    "perfil", "montante", "guia", "drywall", "steel frame", "steel framing",
    "placa", "cimenticia", "glasroc", "siding", "smartside", "modular",
    "parafuso", "conector", "fita", "massa", "lã de vidro", "lã de rocha",
    "isolamento", "telha", "shingle", "osb", "acessorio", "impermeabilizante",
    "ppr", "pvc esgoto", "cabo", "flexivel", "disjuntor", "eletroduto",
    "registro", "caixa", "porcelanato", "argamassa", "tinta"
]

def clean_html(raw_html):
    if not raw_html:
        return ""
    # Unescape HTML entities
    clean = html.unescape(raw_html)
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', clean)
    # Normalize whitespaces
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def parse_html_spec(spec_html, label):
    """
    Tries to find label specifications (e.g., Espessura, Comprimento) inside html text.
    """
    if not spec_html:
        return None
    # Unescape HTML entities
    spec_html = html.unescape(spec_html)
    # Look for <strong>Label:</strong> value or similar patterns
    # e.g., <strong>Espessura:</strong> 0,48 mm
    pattern = rf"(?:<strong>)?{label}:?(?:</strong>)?\s*([^<&\n\r]+)"
    match = re.search(pattern, spec_html, re.IGNORECASE)
    if match:
        val = match.group(1).strip()
        # Clean any trailing html elements or &nbsp;
        val = re.sub(r'<.*?>', '', val)
        val = val.replace('&nbsp;', '').strip()
        return val
    return None

def parse_from_name(name, pattern_regex):
    match = re.search(pattern_regex, name, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def run_scraping():
    print("Starting Espaço Smart catalog sweep...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'
    }
    
    scraped_skus = {}
    
    for query in SEARCH_QUERIES:
        print(f"Sweeping query: '{query}'")
        page = 0
        page_size = 50
        
        while True:
            _from = page * page_size
            _to = _from + page_size - 1
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.espacosmart.com.br/api/catalog_system/pub/products/search?ft={encoded_query}&_from={_from}&_to={_to}"
            
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    if not data:
                        break
                        
                    for product in data:
                        product_id = product.get("productId")
                        product_name = product.get("productName")
                        brand = product.get("brand")
                        link = product.get("link")
                        categories_list = product.get("categories", [])
                        
                        # Primary and secondary categories
                        category = "Outros"
                        subcategory = None
                        if categories_list:
                            parts = [p for p in categories_list[0].split('/') if p]
                            if len(parts) > 0:
                                category = parts[0]
                            if len(parts) > 1:
                                subcategory = parts[1]
                        
                        # Ficha Tecnica HTML
                        ficha_tecnica_list = product.get("Ficha Técnica", [])
                        ficha_tecnica_html = ficha_tecnica_list[0] if ficha_tecnica_list else ""
                        desc_tecnica = clean_html(ficha_tecnica_html) if ficha_tecnica_html else product.get("metaTagDescription", "")
                        
                        items = product.get("items", [])
                        for sku in items:
                            sku_id = sku.get("itemId")
                            sku_name = sku.get("name")
                            sku_name_complete = sku.get("nameComplete")
                            
                            # Reference ID
                            ref_id = None
                            ref_list = sku.get("referenceId", [])
                            if ref_list and isinstance(ref_list, list):
                                ref_id = ref_list[0].get("Value")
                            if not ref_id:
                                ref_id = product.get("productReferenceCode")
                            
                            # Commercial Unit
                            un = sku.get("measurementUnit", "un")
                            if un == "unidade" or un == "unidades":
                                un = "un"
                            elif un == "metros" or un == "metro":
                                un = "m"
                            
                            # Pricing
                            price = None
                            sellers = sku.get("sellers", [])
                            if sellers:
                                offer = sellers[0].get("commertialOffer", {})
                                price_val = offer.get("Price")
                                if price_val is not None and price_val > 0:
                                    price = price_val
                            
                            # Parse technical specs from HTML first, then fall back to name parsing
                            espessura = parse_html_spec(ficha_tecnica_html, "Espessura")
                            comprimento = parse_html_spec(ficha_tecnica_html, "Comprimento")
                            largura = parse_html_spec(ficha_tecnica_html, "Largura")
                            altura = parse_html_spec(ficha_tecnica_html, "Altura")
                            
                            # Regex fallback from SKU Name or Complete Name
                            # Espessura patterns (e.g. 0.90mm, 0,90mm, 1,25 mm, 10mm)
                            if not espessura:
                                espessura = parse_from_name(sku_name_complete, r"(\d+[,\.]\d+\s*mm|\d+\s*mm)")
                            
                            # Comprimento patterns (e.g. 3m, 3000mm, 300cm, 3.00m, 3,00m, 3,66m)
                            if not comprimento:
                                comprimento = parse_from_name(sku_name_complete, r"(\d+[,\.]\d+\s*m|\d+\s*m\b|\d{4}\s*mm\b)")
                            
                            # Dimension assembly
                            dimensoes = None
                            if largura or altura:
                                dim_parts = []
                                if largura:
                                    dim_parts.append(f"L: {largura}")
                                if altura:
                                    dim_parts.append(f"A: {altura}")
                                dimensoes = " | ".join(dim_parts)
                            else:
                                # Try parsing dimension format like 90x40x15 or 90mm
                                dim_match = re.search(r"(\d+x\d+x\d+|\d+x\d+)", sku_name_complete, re.IGNORECASE)
                                if dim_match:
                                    dimensoes = dim_match.group(1)
                            
                            # If we don't have price, or it's unavailable, let's keep it but store None
                            # Structure normalized product SKU object
                            normalized_item = {
                                "id": sku_id,
                                "nome": sku_name_complete or sku_name or product_name,
                                "codigo": ref_id,
                                "categoria": category,
                                "subcategoria": subcategory,
                                "desc": desc_tecnica if desc_tecnica else None,
                                "dimensoes": dimensoes,
                                "espessura": espessura,
                                "comprimento": comprimento,
                                "un": un,
                                "fabricante": brand,
                                "preco": price,
                                "url": link
                            }
                            
                            # Save/overwrite SKU to guarantee uniqueness
                            scraped_skus[sku_id] = normalized_item
                            
                    # If returned less than page size, page end reached
                    if len(data) < page_size:
                        break
                    page += 1
                    time.sleep(0.1) # Be gentle with API rate limits
            except Exception as e:
                print(f"Error fetching query '{query}' page {page}: {e}")
                break
                
    # Final list of products
    all_products = list(scraped_skus.values())
    
    # Save raw extraction to json file
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'scraped_products.json'))
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, indent=2, ensure_ascii=False)
        
    print(f"Finished. Extracted {len(all_products)} unique product items/variations.")

if __name__ == "__main__":
    run_scraping()
