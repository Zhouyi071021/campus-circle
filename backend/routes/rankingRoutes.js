const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// 获取最新一周的排行榜
router.get('/:type', async (req, res) => {
  const { type } = req.params; // user, post, school
  try {
    // 获取最近一周的排名
    const { data, error } = await supabase
      .from('weekly_rankings')
      .select('*')
      .eq('type', type)
      .order('rank', { ascending: true })
      .limit(10);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;