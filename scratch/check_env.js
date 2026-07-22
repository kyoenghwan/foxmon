const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

console.log("=== Loaded Env Keys containing 'SUPABASE' ===");
const keys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
console.log("Keys:", keys);
for (const key of keys) {
    console.log(`${key}:`, process.env[key] ? 'Defined (length: ' + process.env[key].length + ')' : 'Undefined');
}
