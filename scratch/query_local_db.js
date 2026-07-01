const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:password@localhost:5432/foxmon?schema=public",
});

async function run() {
  await client.connect();

  const resRooms = await client.query('SELECT id, type, title, employer_id, seeker_id FROM foxtalk_rooms;');
  console.log('ROOMS:', resRooms.rows);

  const resMsgs = await client.query(`
      SELECT m.id, m.room_id, m.content, p.nickname, r.title, r.type
      FROM foxtalk_messages m
      LEFT JOIN foxtalk_participants p ON m.participant_id = p.id
      LEFT JOIN foxtalk_rooms r ON m.room_id = r.id
      ORDER BY m.created_at ASC;
  `);
  console.log('MESSAGES:', resMsgs.rows);

  await client.end();
}
run().catch(console.error);
