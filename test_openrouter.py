import requests
import os
from dotenv import load_dotenv

load_dotenv(r'D:\TARA\4-2\edupredict-ai\backend\.env')
key = os.getenv('OPENROUTER_API_KEY')
print('Key:', key[:20] + '...' if key else 'None')

r = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'EduPredict AI'
    },
    json={
        'model': 'meta-llama/llama-3.3-70b-instruct:free',
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 100,
        'temperature': 0.5
    },
    timeout=30
)
print('Status:', r.status_code)
print('Response:', r.text)