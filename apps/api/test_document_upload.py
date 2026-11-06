import os
import uuid
import urllib.request

URL = (
    "http://127.0.0.1:8000"
    "/api/v1/admin/shipments/"
    "be0feed9-c749-4b79-b6aa-d88d3b037ff1"
    "/documents"
)

TOKEN = os.environ.get("GLP_AUTH_TOKEN")

if not TOKEN:
    raise SystemExit("GLP_AUTH_TOKEN is not set.")

file_path = "test-document.txt"

boundary = "----GLPBoundary" + uuid.uuid4().hex

with open(file_path, "rb") as f:
    file_content = f.read()

parts = []

parts.append(
    f"--{boundary}\r\n"
    'Content-Disposition: form-data; name="document_type"\r\n\r\n'
    "other\r\n"
)

parts.append(
    f"--{boundary}\r\n"
    'Content-Disposition: form-data; name="visibility"\r\n\r\n'
    "internal\r\n"
)

file_header = (
    f"--{boundary}\r\n"
    'Content-Disposition: form-data; name="file"; '
    'filename="test-document.txt"\r\n'
    "Content-Type: text/plain\r\n\r\n"
).encode()

body = (
    "".join(parts).encode()
    + file_header
    + file_content
    + f"\r\n--{boundary}--\r\n".encode()
)

request = urllib.request.Request(
    URL,
    data=body,
    method="POST",
    headers={
        "Authorization": TOKEN,
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
)

try:
    with urllib.request.urlopen(request) as response:
        print("Status:", response.status)
        print(response.read().decode())

except urllib.error.HTTPError as error:
    print("Upload failed")
    print("Status:", error.code)
    print(error.read().decode())