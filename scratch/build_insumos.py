import json
import re
import os
import sys

# Ensure console output is encoded as UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRAPED_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'scraped_products.json'))
INSUMOS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'utils', 'insumosSF.js'))

def clean_str(s):
    if not s:
        return ""
    s = s.lower()
    s = s.replace("×", "x").replace("ø", "").replace("⌀", "")
    s = re.sub(r'[áàâãä]', 'a', s)
    s = re.sub(r'[éèêë]', 'e', s)
    s = re.sub(r'[íìîï]', 'i', s)
    s = re.sub(r'[óòôõö]', 'o', s)
    s = re.sub(r'[úùûü]', 'u', s)
    s = re.sub(r'[ç]', 'c', s)
    return s

def flexible_match(orig_name, scraped_list):
    o_clean = clean_str(orig_name)
    
    # 1. Profiles (Montantes and Guias)
    is_montante = "montante" in o_clean
    is_guia = "guia" in o_clean
    
    if is_montante or is_guia:
        width = None
        if "90" in o_clean or "92" in o_clean:
            width = 90
        elif "150" in o_clean or "152" in o_clean or "140" in o_clean:
            width = 140
        elif "200" in o_clean or "202" in o_clean:
            width = 200
            
        length = None
        if "3000" in o_clean or "3m" in o_clean:
            length = 3000
        elif "6000" in o_clean or "6m" in o_clean:
            length = 6000
            
        thick = None
        if "0,90" in o_clean or "0.90" in o_clean or "0,95" in o_clean:
            thick = 0.95
        elif "1,25" in o_clean or "1.25" in o_clean:
            thick = 0.95
        elif "1,50" in o_clean or "1.50" in o_clean:
            thick = 0.95
            
        best_match = None
        for p in scraped_list:
            n = clean_str(p["nome"])
            p_is_montante = "montante" in n
            p_is_guia = "guia" in n
            
            if (is_montante and p_is_montante) or (is_guia and p_is_guia):
                p_width = None
                if "90" in n: p_width = 90
                elif "140" in n or "150" in n: p_width = 140
                elif "200" in n: p_width = 200
                
                if p_width == width:
                    p_thick = None
                    if "0,8" in n: p_thick = 0.8
                    elif "0,95" in n: p_thick = 0.95
                    
                    p_length = None
                    if "3000" in n or "3m" in n: p_length = 3000
                    elif "6000" in n or "6m" in n: p_length = 6000
                    
                    if p_thick == thick and (length is None or p_length == length):
                        return p
                    elif p_width == width:
                        best_match = p
        if best_match:
            return best_match

    # 2. OSB Boards
    if "osb" in o_clean:
        for t in ["11,1", "11.1", "15", "18"]:
            if t in o_clean:
                t_comma = t.replace(".", ",")
                t_dot = t.replace(",", ".")
                for p in scraped_list:
                    n = clean_str(p["nome"])
                    if "osb" in n and (t_comma in n or t_dot in n):
                        return p

    # 3. Cement Boards / Placa Cimentícia / Glasroc X
    if "cimenticia" in o_clean:
        for t in ["10", "12"]:
            if t in o_clean:
                for p in scraped_list:
                    n = clean_str(p["nome"])
                    if ("cimenticia" in n or "cimenticio" in n) and t in n:
                        return p
                    
    if "glasroc" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "glasroc" in n:
                return p

    # 4. Siding Vinílico / SmartSide
    if "siding" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "siding" in n:
                return p
    if "smart side" in o_clean or "smartside" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "smart" in n and "side" in n:
                return p

    # 5. Gesso Boards
    if "gesso" in o_clean:
        board_type = None
        if "ru" in o_clean: board_type = "ru"
        elif "rf" in o_clean: board_type = "rf"
        elif "ba" in o_clean or "standard" in o_clean or "12,5" in o_clean: board_type = "st"
        
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "gesso" in n or "drywall" in n:
                if board_type == "ru" and ("ru" in n or "umid" in n or "verde" in n):
                    return p
                elif board_type == "rf" and ("rf" in n or "fogo" in n or "rosa" in n):
                    return p
                elif board_type == "st" and ("st" in n or "standard" in n or "chapa gesso" in n or "branca" in n):
                    return p

    # 6. Lãs (Isolamento)
    if "la de vidro" in o_clean:
        for t in ["50", "75"]:
            if t in o_clean:
                for p in scraped_list:
                    n = clean_str(p["nome"])
                    if "la" in n and "vidro" in n and t in n:
                        return p
    if "la de rocha" in o_clean:
        for t in ["50", "75"]:
            if t in o_clean:
                for p in scraped_list:
                    n = clean_str(p["nome"])
                    if "la" in n and "rocha" in n and t in n:
                        return p

    # 7. Shingle Roofing
    if "shingle" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "shingle" in n:
                return p

    # 8. Parafusos / Fixadores
    if "parafuso" in o_clean:
        size_match = re.search(r"(\d+[,\.]\d+)\s*[x×]\s*(\d+)", o_clean)
        if size_match:
            d1 = size_match.group(1).replace(",", ".")
            d2 = size_match.group(2)
            d1_alt = d1.replace(".", ",")
            for p in scraped_list:
                n = clean_str(p["nome"])
                if "parafuso" in n and (d1 in n or d1_alt in n) and d2 in n:
                    return p
            for p in scraped_list:
                n = clean_str(p["nome"])
                if "parafuso" in n and d2 in n:
                    return p
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "parafuso" in n:
                return p

    # 9. Massas / Fitagem
    if "massa" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "massa" in n:
                return p
    if "fita" in o_clean:
        for p in scraped_list:
            n = clean_str(p["nome"])
            if "fita" in n:
                return p

    # 10. Generic substring / keyword match fallback
    words = [w for w in o_clean.split() if len(w) > 3 and w not in ["para", "com", "uma", "uns", "das", "dos", "via", "nº", "geral", "tabela", "base"]]
    if words:
        best_p = None
        best_count = 0
        for p in scraped_list:
            n = clean_str(p["nome"])
            count = sum(1 for w in words if w in n)
            if count > best_count:
                best_count = count
                best_p = p
        if best_count >= len(words) * 0.6:
            return best_p

    return None

def format_js_val(v):
    if v is None:
        return "null"
    return json.dumps(v, ensure_ascii=False)

def main():
    if not os.path.exists(SCRAPED_PATH):
        print(f"Scraped path doesn't exist: {SCRAPED_PATH}")
        return
    if not os.path.exists(INSUMOS_PATH):
        print(f"Insumos path doesn't exist: {INSUMOS_PATH}")
        return
        
    with open(SCRAPED_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)
        
    with open(INSUMOS_PATH, "r", encoding="utf-8") as f:
        # Since we modified the file in the previous run, we want to reload it clean from Git,
        # or parse it as it currently is. Parsing it currently is fine because our regex matches
        # the format regardless of whether the metadata is already added.
        # But wait! If the file is already modified, the items now have codigo, marca, etc.
        # So we should run `git checkout` first to make sure we run on a clean file,
        # ensuring we don't duplicate attributes!
        # Let's clean the file from Git first.
        pass
        
    # We will do Git checkout via Python or command line. We'll run the command line git checkout first.
    # Actually, we can run git checkout src/utils/insumosSF.js
    # Let's implement this logic.
    
    # We will load the clean content of insumosSF.js
    with open(INSUMOS_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    updated_lines = []
    matched_count = 0
    total_items = 0
    
    # Regex matching the basic item pattern (or the enriched pattern from previous run to be safe)
    # E.g. { nome: "...", un: "...", base: ..., preco: ..., grupo: "...", categoria: "..." }
    # Let's write a regex that matches both original and enriched item shapes
    item_pattern = re.compile(
        r'^(\s*\{\s*nome:\s*"([^"]+)",\s*un:\s*"([^"]+)",\s*base:\s*([^,]+),\s*preco:\s*)([^,]+)(,\s*grupo:\s*"([^"]+)",\s*categoria:\s*"([^"]+)"(.*)\}\s*,?\s*(\/\/.*)?)$'
    )
    
    for idx, line in enumerate(lines):
        match = item_pattern.match(line)
        if match:
            total_items += 1
            prefix = match.group(1)
            name = match.group(2)
            un = match.group(3)
            base = match.group(4)
            orig_price = match.group(5)
            group = match.group(7)
            category = match.group(8)
            suffix_attrs = match.group(9)
            comment = match.group(10) or ""
            
            p_match = flexible_match(name, products)
            
            price = orig_price.strip()
            codigo = "null"
            marca = "null"
            url = "null"
            espessura = "null"
            comprimento = "null"
            dimensoes = "null"
            desc_val = "null"
            
            existing_desc_match = re.search(r'desc:\s*"([^"]+)"', suffix_attrs)
            if existing_desc_match:
                desc_val = format_js_val(existing_desc_match.group(1))
            
            if p_match:
                matched_count += 1
                if p_match["preco"] is not None:
                    price = str(p_match["preco"])
                codigo = format_js_val(p_match["codigo"])
                marca = format_js_val(p_match["fabricante"])
                url = format_js_val(p_match["url"])
                espessura = format_js_val(p_match["espessura"])
                comprimento = format_js_val(p_match["comprimento"])
                dimensoes = format_js_val(p_match["dimensoes"])
                if p_match["desc"]:
                    desc_val = format_js_val(p_match["desc"])
            
            # Clean suffix attributes (remove desc, codigo, marca, url, espessura, comprimento, dimensoes to avoid duplicates)
            clean_suffix = suffix_attrs.strip()
            for key in ["desc", "codigo", "marca", "url", "espessura", "comprimento", "dimensoes"]:
                # Remove pattern like: , key: "..." or , key: null
                clean_suffix = re.sub(rf',\s*{key}:\s*"[^"]*"', '', clean_suffix)
                clean_suffix = re.sub(rf',\s*{key}:\s*null', '', clean_suffix)
                clean_suffix = re.sub(rf',\s*{key}:\s*[^,\s}}]+', '', clean_suffix)
            
            clean_suffix = clean_suffix.strip()
            if clean_suffix.endswith(','):
                clean_suffix = clean_suffix[:-1].strip()
            if clean_suffix.startswith(','):
                clean_suffix = clean_suffix[1:].strip()
            
            indent = line[:len(line) - len(line.lstrip())]
            
            parts = [
                f'nome: "{name}"',
                f'un: "{un}"',
                f'base: {base.strip()}',
                f'preco: {price}',
                f'grupo: "{group}"',
                f'categoria: "{category}"'
            ]
            if desc_val != "null":
                parts.append(f'desc: {desc_val}')
            if clean_suffix:
                parts.append(clean_suffix)
            parts.extend([
                f'codigo: {codigo}',
                f'marca: {marca}',
                f'url: {url}',
                f'espessura: {espessura}',
                f'comprimento: {comprimento}',
                f'dimensoes: {dimensoes}'
            ])
            
            new_line = indent + "{ " + ", ".join(parts) + " },"
            if comment:
                new_line += " " + comment.strip()
            new_line += "\n"
            updated_lines.append(new_line)
        else:
            if "export const CATALOGO_PRODUTOS" in line:
                break
            updated_lines.append(line)
            
    catalog_json = json.dumps(products, indent=2, ensure_ascii=False)
    updated_lines.append("\n// CATALOGO DE PRODUTOS COMPLETO ESPACO SMART\n")
    updated_lines.append(f"export const CATALOGO_PRODUTOS = {catalog_json};\n")
    
    with open(INSUMOS_PATH, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
        
    print(f"Updated {INSUMOS_PATH} successfully!")
    print(f"Total Database Items: {total_items}")
    print(f"Enriched/Matched with live prices: {matched_count} ({matched_count/total_items:.1%})")

if __name__ == "__main__":
    main()
