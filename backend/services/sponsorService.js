const supabase = require('../utils/supabase');

async function getPublicSponsors(limit = 20) {
  const { data, error } = await supabase
    .from('sponsors')
    .select(`
      id,
      amount,
      message,
      created_at,
      user:users(id, username, avatar_url)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

module.exports = { getPublicSponsors };