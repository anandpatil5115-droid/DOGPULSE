import urllib.request
import json

url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
headers = {
    'Authorization': 'Bearer YOUR_GCP_API_KEY_HERE',
    'Content-Type': 'application/json'
}
data = {
    'model': 'gemini-1.5-flash',
    'messages': [{'role': 'user', 'content': 'Hello!'}]
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f'HTTP Error: {e.code}')
    print(e.read().decode('utf-8'))
