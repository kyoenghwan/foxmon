const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyPassword = 'Rudghks!1';
const keyFilePath = path.resolve('./keys/mok_keyInfo.dat');
const encryptedData = fs.readFileSync(keyFilePath);

const passwordBytes = Buffer.from(keyPassword, 'utf8');
const hash1 = crypto.createHash('sha256').update(passwordBytes).digest();
const aesKeyBytes = Buffer.alloc(32);
hash1.copy(aesKeyBytes, 0, 0, 16);
const hash2 = crypto.createHash('sha256').update(hash1).digest();
hash2.copy(aesKeyBytes, 16, 16, 32);
const aesIvBytes = Buffer.alloc(16);
hash2.copy(aesIvBytes, 0, 0, 16);

const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBytes, aesIvBytes);
let decrypted = decipher.update(encryptedData);
decrypted = Buffer.concat([decrypted, decipher.final()]);
const keyInfoJson = JSON.parse(decrypted.toString('utf8'));

console.log('ServiceId:', keyInfoJson.ServiceId);
