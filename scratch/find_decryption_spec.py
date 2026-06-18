import os
from pypdf import PdfReader

pdf_path = "../기술자료/개발가이드_API_휴대폰 본인확인서비스_V3.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "../기술자료/V3_본인확인_API_개발가이드.pdf"

print(f"Reading PDF: {pdf_path}")
reader = PdfReader(pdf_path)

search_keywords = ["encryptMOKResult", "decrypt", "복호화", "OAEP", "Padding", "RSA", "MGF1"]

found_pages = {}

for i, page in enumerate(reader.pages):
    text = page.extract_text()
    for kw in search_keywords:
        if kw.lower() in text.lower():
            if kw not in found_pages:
                found_pages[kw] = []
            found_pages[kw].append(i+1)

for kw, pages in found_pages.items():
    print(f"Keyword '{kw}' found on pages: {pages}")

# 특히 encryptMOKResult 나 복호화에 대해 상세 출력을 진행
target_keywords = ["encryptMOKResult", "MGF1", "OAEP"]
for kw in target_keywords:
    print(f"\n--- Detailed search for '{kw}' ---")
    count = 0
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if kw.lower() in text.lower():
            count += 1
            if count > 5:  # 너무 많이 출력되는 것을 방지
                break
            print(f"=== Page {i+1} ===")
            idx = text.lower().find(kw.lower())
            start = max(0, idx - 200)
            end = min(len(text), idx + 500)
            print(text[start:end])
            print("="*50)
