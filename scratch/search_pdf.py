import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    import subprocess
    print("pypdf not found. Installing via pip...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    from pypdf import PdfReader

pdf_path = r"D:\Antigravity\Foxmon\기술자료\개발가이드_API_휴대폰 본인확인서비스_V3.pdf"
if not os.path.exists(pdf_path):
    pdf_path = r"D:\Antigravity\Foxmon\기술자료\V3_본인확인_API_개발가이드.pdf"

reader = PdfReader(pdf_path)
print(f"Total Pages: {len(reader.pages)}")

keywords = ["node", "express", "key_manager", "mobileok", "require", "getResult"]

for idx, page in enumerate(reader.pages):
    text = page.extract_text()
    for kw in keywords:
        if kw.lower() in text.lower():
            print(f"=== Found '{kw}' in Page {idx + 1} ===")
            pos = text.lower().find(kw.lower())
            start = max(0, pos - 150)
            end = min(len(text), pos + 300)
            print(text[start:end])
            print("===================================\n")
