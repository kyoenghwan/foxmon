import os
import zipfile

for file in os.listdir("D:\\Antigravity\\Foxmon"):
    if file.endswith(".zip"):
        print(f"=== File: {file} ===")
        try:
            with zipfile.ZipFile(os.path.join("D:\\Antigravity\\Foxmon", file), 'r') as zip_ref:
                for name in zip_ref.namelist():
                    print(f"  - {name}")
        except Exception as e:
            print(f"  Error: {e}")
