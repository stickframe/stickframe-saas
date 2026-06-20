import urllib.request
import urllib.error

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}

req = urllib.request.Request('https://www.espacosmart.com.br', headers=headers)

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        html = response.read().decode('utf-8')
        print("Status Code:", response.status)
        print("Content Length:", len(html))
        print("Content Snippet:", html[:300])
except urllib.error.URLError as e:
    print("URLError:", e)
except Exception as e:
    print("Error:", e)
