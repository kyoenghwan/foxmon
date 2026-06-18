const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('guest1234!', salt);
console.log('HASH:', hash);
