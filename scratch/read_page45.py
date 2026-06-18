import os
from pypdf import PdfReader

pdf_path = "./기술자료/개발가이드_API_휴대폰 본인확인서비스_V3.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "./기술자료/V3_본인확인_API_개발가이드.pdf"

reader = PdfReader(pdf_path)
# 45페이지와 46페이지 텍스트 추출 (0-indexed이므로 44, 45)
print("=== PAGE 45 ===")
print(reader.pages[44].extract_text())
print("\n=== PAGE 46 ===")
print(reader.pages[45].extract_text())
