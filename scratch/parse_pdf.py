import os
from pypdf import PdfReader

pdf_path = "V3_본인확인_API_개발가이드.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "개발가이드_API_휴대폰 본인확인서비스_V3.pdf"

print(f"Reading PDF: {pdf_path}")
reader = PdfReader(pdf_path)

search_keywords = ["MOKVerifyInfo", "authNumber", "confirm", "2908"]

for i, page in enumerate(reader.pages):
    text = page.extract_text()
    for kw in search_keywords:
        if kw.lower() in text.lower():
            print(f"=== Found '{kw}' on Page {i+1} ===")
            # 찾은 위치 근처의 텍스트 400자 출력
            idx = text.lower().find(kw.lower())
            start = max(0, idx - 150)
            end = min(len(text), idx + 400)
            print(text[start:end])
            print("="*40)
