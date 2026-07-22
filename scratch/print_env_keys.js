const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  // 비밀번호 마스킹하여 구조 출력
  const parsed = new URL(dbUrl);
  console.log('Database URL Components:');
  console.log('Protocol:', parsed.protocol);
  console.log('Username:', parsed.username);
  console.log('Host:', parsed.hostname);
  console.log('Port:', parsed.port);
  console.log('Database:', parsed.pathname);
} else {
  console.log('No DATABASE_URL found in env.');
}
