const supabase = require('../utils/supabase');

/**
 * 获取音乐列表
 * @param {Object} options - 查询参数 { status, page, pageSize }
 * @returns {Promise<Array>} 音乐列表
 */
async function getMusicList(options = {}) {
  const { status, page = 1, pageSize = 100 } = options;
  let query = supabase
    .from('music')
    .select('*', { count: 'exact' })
    .order('sort', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  // 支持分页（可选）
  if (pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { list: data, total: count };
}

/**
 * 根据ID获取单首音乐
 * @param {number} id
 * @returns {Promise<Object>}
 */
async function getMusicById(id) {
  const { data, error } = await supabase
    .from('music')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  getMusicList,
  getMusicById,
};