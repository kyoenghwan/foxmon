const { Client } = require('pg');

const config = {
    hosts: [
        'aws-0-ap-northeast-2.pooler.supabase.com',
        'db.kgwvftaebjkjwwpsftqv.supabase.co'
    ],
    ports: [6543, 5432],
    users: [
        'postgres',
        'postgres.kgwvftaebjkjwwpsftqv'
    ],
    passwords: [
        'Rudghks!1',
        'Rudghks',
        'postgres',
        'password',
        '1234',
        'foxmon'
    ],
    dbs: ['postgres']
};

async function scan() {
    console.log('🔄 Scanning remote database connection combinations...');
    
    for (const host of config.hosts) {
        for (const port of config.ports) {
            for (const user of config.users) {
                for (const pw of config.passwords) {
                    for (const db of config.dbs) {
                        const connStr = `postgresql://${user}:${encodeURIComponent(pw)}@${host}:${port}/${db}`;
                        const client = new Client({ 
                            connectionString: connStr, 
                            connectionTimeoutMillis: 1500,
                            ssl: { rejectUnauthorized: false }
                        });
                        try {
                            await client.connect();
                            console.log(`\n🎉 SUCCESS! Connected successfully!`);
                            console.log(`Connection string: postgresql://${user}:***@${host}:${port}/${db}`);
                            
                            // 간단한 쿼리 테스트
                            const res = await client.query('SELECT version();');
                            console.log('PG version:', res.rows[0].version);
                            
                            await client.end();
                            process.exit(0);
                        } catch (err) {
                            // 에러가 "not found" 인지 "password authentication failed" 인지 등을 출력하여 디버그 단서 수집
                            console.log(`❌ Failed: ${user}@${host}:${port} (${err.message.substring(0, 80)})`);
                            await client.end().catch(() => {});
                        }
                    }
                }
            }
        }
    }
    console.log('\n❌ All combinations scanned. No success.');
}

scan();
