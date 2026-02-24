const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// 获取学校列表（支持分页和搜索）
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, pageSize = 100 } = req.query;
    let query = supabase
      .from('schools')
      .select('*', { count: 'exact' })
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    res.json({ success: true, data, total: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取学校详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ success: false, error: '学校不存在' });
  res.json({ success: true, data });
});

// 获取学校的帖子
router.get('/:id/posts', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:users(id, username, avatar_url)', { count: 'exact' })
    .eq('school_id', id)
    .eq('status', 'normal')
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  res.json({ success: true, list: data, total: count });
});

module.exports = router;