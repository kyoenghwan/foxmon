import os
from pypdf import PdfReader

pdf_path = "V3_본인확인_API_개발가이드.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "개발가이드_API_휴대폰 본인확인서비스_V3.pdf"

reader = PdfReader(pdf_path)

with open("scratch/pdf_pages_dump.txt", "w", encoding="utf-8") as f:
    # 30페이지부터 40페이지까지 덤프
    for page_num in range(30, 40):
        if page_num < len(reader.pages):
            f.write(f"\n\n--- PAGE {page_num+1} ---\n")
            f.write(reader.pages[page_num].extract_text())
print("Dump completed.")
