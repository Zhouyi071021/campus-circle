const supabase = require('../utils/supabase');

// 获取公告列表（支持分页、筛选）
async function getAnnouncements({ page = 1, pageSize = 20, isActive = true } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('announcements')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { list: data, total: count };
}

// 获取单条公告
async function getAnnouncementById(id) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// 创建公告
async function createAnnouncement(data) {
  const { data: result, error } = await supabase
    .from('announcements')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

// 更新公告
async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 删除公告
async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};