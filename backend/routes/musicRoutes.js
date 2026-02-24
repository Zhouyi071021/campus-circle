const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');


// 获取音乐列表（支持过滤状态）
router.get('/', async (req, res) => {
  try {
    const { status, page, pageSize } = req.query;
    const result = await musicService.getMusicList({
      status,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
    res.json({ success: true, data: result.list, total: result.total });
  } catch (err) {
    console.error('获取音乐列表失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// 获取单首音乐详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const music = await musicService.getMusicById(id);
    res.json({ success: true, data: music });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;