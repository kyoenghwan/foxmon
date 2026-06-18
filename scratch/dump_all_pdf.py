import os
from pypdf import PdfReader

pdf_path = "../기술자료/개발가이드_API_휴대폰 본인확인서비스_V3.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../기술자료/V3_본인확인_API_개발가이드.pdf"

print(f"Reading PDF: {pdf_path}")
reader = PdfReader(pdf_path)

with open("all_pdf_dump.txt", "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        f.write(f"\n--- PAGE {i+1} ---\n")
        f.write(text)

print(f"Successfully dumped {len(reader.pages)} pages to all_pdf_dump.txt")
