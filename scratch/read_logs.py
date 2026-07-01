import json
import sys

# 표준 출력을 UTF-8로 변경
sys.stdout.reconfigure(encoding='utf-8')

log_path = r"C:\Users\kyoen\.gemini\antigravity-ide\brain\cb3754a3-93b7-4366-9916-c0e8600d164d\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index')
            # 2880부터 2886까지 상세 출력
            if step is not None and 2880 <= step <= 2886:
                print(f"=== Step {step} ({data.get('source')}/{data.get('type')}) ===")
                print(data.get('content'))
                if 'tool_calls' in data and data['tool_calls']:
                    print("Tool Calls:", json.dumps(data['tool_calls'], indent=2, ensure_ascii=False))
                print("-" * 50)
        except Exception as e:
            pass
