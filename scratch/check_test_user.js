const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, login_id, role, is_age_verified, password')
    .eq('login_id', 'test1');

  if (error) {
    console.error('에러 발생:', error.message);
    return;
  }

  if (users.length === 0) {
    console.log('test1 유저가 없습니다.');
    return;
  }

  const user = users[0];
  const isMatch = await bcrypt.compare('test1', user.password);
  console.log('기존 비밀번호가 test1인가요?:', isMatch);

  if (!isMatch) {
    console.log('비밀번호가 test1과 다릅니다. test1으로 재설정합니다.');
    const newHash = await bcrypt.hash('test1', 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newHash })
      .eq('login_id', 'test1');

    if (updateError) {
      console.error('업데이트 에러:', updateError.message);
    } else {
      console.log('성공적으로 test1 계정의 비밀번호를 test1으로 재설정했습니다.');
    }
  }
}

run();
