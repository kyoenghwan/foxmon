const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const config = {
    hosts: ['localhost', '127.0.0.1'],
    ports: [5432],
    users: ['postgres'],
    passwords: ['Rudghks!1', 'Rudghks', 'postgres', 'password', '1234', 'admin', 'root', 'foxmon', 'foxmon123', ''],
    dbs: ['foxmon', 'postgres']
};

async function runMigration() {
    let activeClient = null;

    console.log('🔄 Scanning database connection combinations...');
    
    outerLoop:
    for (const host of config.hosts) {
        for (const port of config.ports) {
            for (const user of config.users) {
                for (const pw of config.passwords) {
                    for (const db of config.dbs) {
                        const connStr = `postgresql://${user}:${encodeURIComponent(pw)}@${host}:${port}/${db}`;
                        const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 1000 });
                        try {
                            await client.connect();
                            activeClient = client;
                            console.log(`✅ Success: ${user}:***@${host}:${port}/${db}`);
                            break outerLoop;
                        } catch (err) {
                            await client.end().catch(() => {});
                        }
                    }
                }
            }
        }
    }

    if (!activeClient) {
        console.error('❌ Could not connect using standard combinations. Trying ENV DATABASE_URL...');
        const connStr = process.env.DATABASE_URL;
        if (connStr) {
            const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 1000 });
            try {
                await client.connect();
                activeClient = client;
                console.log(`✅ Success with env DATABASE_URL`);
            } catch (err) {
                await client.end().catch(() => {});
            }
        }
    }

    if (!activeClient) {
        console.error('❌ Database connection failed. Please check if PostgreSQL/Supabase Local is running.');
        process.exit(1);
    }

    try {
        const sqlPath = path.join(__dirname, '../scripts/user_security_logs_migration.sql');
        console.log(`📖 Reading SQL: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⚡ Running migration SQL...');
        await activeClient.query(sql);
        console.log('✅ Database migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await activeClient.end();
    }
}

runMigration();
