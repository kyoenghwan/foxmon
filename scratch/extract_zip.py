import os
import zipfile

# UTF-8로 파일명을 강제 디코딩하거나 파이썬 zipfile의 기본 한글 깨짐 대응
os.makedirs('./scratch/op_zip_extract', exist_ok=True)
os.makedirs('./scratch/dev_zip_extract', exist_ok=True)

for file in os.listdir('.'):
    if '운영용' in file and file.endswith('.zip'):
        print(f"Extracting {file}...")
        try:
            with zipfile.ZipFile(file, 'r') as zip_ref:
                for member in zip_ref.namelist():
                    try:
                        filename = member.encode('cp437').decode('cp949')
                    except:
                        filename = member
                    
                    target_path = os.path.join('./scratch/op_zip_extract', filename)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    if not filename.endswith('/'):
                        with zip_ref.open(member, pwd=b'Rudghks!1') as source, open(target_path, "wb") as target:
                            target.write(source.read())
                print("Extracted successfully.")
        except Exception as e:
            print("Error extracting operational zip:", str(e))

for file in os.listdir('.'):
    if '개발용' in file and file.endswith('.zip'):
        print(f"Extracting {file}...")
        try:
            with zipfile.ZipFile(file, 'r') as zip_ref:
                for member in zip_ref.namelist():
                    try:
                        filename = member.encode('cp437').decode('cp949')
                    except:
                        filename = member
                    
                    target_path = os.path.join('./scratch/dev_zip_extract', filename)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    if not filename.endswith('/'):
                        with zip_ref.open(member, pwd=b'Rudghks!1') as source, open(target_path, "wb") as target:
                            target.write(source.read())
                print("Extracted successfully.")
        except Exception as e:
            print("Error extracting development zip:", str(e))
