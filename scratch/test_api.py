import urllib.request
import urllib.error
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}

url = 'https://www.espacosmart.com.br/api/catalog_system/pub/products/search?ft=perfil&_from=0&_to=5'
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        print("Success! Number of products returned:", len(data))
        if data:
            print("First product sample:")
            p = data[0]
            print("Name:", p.get('productName'))
            print("Brand:", p.get('brand'))
            print("Categories:", p.get('categories'))
            print("Items (SKUs):", len(p.get('items', [])))
            sku = p.get('items')[0] if p.get('items') else {}
            print("SKU Name:", sku.get('name'))
            print("SKU Reference:", sku.get('referenceId'))
            print("SKU Prices (sellers):", len(sku.get('sellers', [])))
except Exception as e:
    print("Error:", e)
