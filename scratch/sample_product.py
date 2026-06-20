import urllib.request
import urllib.error
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

# Query specifically for a steel frame profile or similar
url = 'https://www.espacosmart.com.br/api/catalog_system/pub/products/search?ft=perfil&_from=0&_to=1'
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        if data:
            print(json.dumps(data[0], indent=2, ensure_ascii=False))
        else:
            print("No data found")
except Exception as e:
    print("Error:", e)
