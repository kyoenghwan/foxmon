import os
from pypdf import PdfReader

pdf_path = "V3_본인확인_API_개발가이드.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "개발가이드_API_휴대폰 본인확인서비스_V3.pdf"

reader = PdfReader(pdf_path)

print("Searching for error code 2908...")
found = False
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    if "2908" in text:
        print(f"Found '2908' on Page {i+1}:")
        print(text)
        found = True

if not found:
    print("Error code 2908 not found in PDF text.")
