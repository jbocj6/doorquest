import requests

url = "http://127.0.0.1:8000/upload-door-pic"
data = {"username": "testuser"}
files = {"file": open("test.jpg", "rb")}

response = requests.post(url, data=data, files=files)
print(response.json())