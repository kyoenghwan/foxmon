const { Client } = require('pg');

// Supabase Connection String 추정치
const connStr = 'postgresql://postgres.kgwvftaebjkjwwpsftqv:Rudghks!1@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';

async function testConnection() {
    console.log('📡 Connecting to remote Supabase database...');
    const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 5000 });
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT version();');
        console.log('Postgres version:', res.rows[0].version);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.end();
    }
}

testConnection();
