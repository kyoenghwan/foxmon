const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\kyoen\\.gemini\\antigravity-ide\\brain\\32f363f0-912b-434f-8c35-377997392e6b\\.system_generated\\logs\\transcript.jsonl';
const outputPath = path.join(__dirname, 'mok_server_std_sample.js');

async function extract() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // step_index 11430에 사용자가 올린 mok_server_std.js 전문이 포함되어 있음
    if (line.includes('"step_index":11430') || (line.includes('const express = require') && line.includes('USER_INPUT'))) {
      const obj = JSON.parse(line);
      const content = obj.content;
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log('✅ 추출 성공! 출력 경로:', outputPath);
      break;
    }
  }
}

extract();
