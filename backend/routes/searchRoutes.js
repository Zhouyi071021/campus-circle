const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

router.get('/comprehensive', async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20 } = req.query;
    if (!q) {
      return res.json({ success: true, data: { posts: [], users: [], schools: [], businesses: [] } });
    }
    const [posts, users, schools, businesses] = await Promise.all([
      searchService.searchPosts(q, { page, pageSize }),
      searchService.searchUsers(q, page, pageSize),
      searchService.searchSchools(q, page, pageSize),
      searchService.searchBusinesses(q, page, pageSize),
    ]);
    res.json({
      success: true,
      data: {
        posts: posts.list,
        users: users.list,
        schools: schools.list,
        businesses: businesses.list,
      },
      total: {
        posts: posts.total,
        users: users.total,
        schools: schools.total,
        businesses: businesses.total,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 分类型搜索
router.get('/posts', async (req, res) => {
  try {
    const { q, page, pageSize, schoolId, timeRange } = req.query;
    const result = await searchService.searchPosts(q, { page, pageSize, schoolId, timeRange });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { q, page, pageSize } = req.query;
    const result = await searchService.searchUsers(q, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/schools', async (req, res) => {
  try {
    const { q, page, pageSize } = req.query;
    const result = await searchService.searchSchools(q, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/businesses', async (req, res) => {
  try {
    const { q, page, pageSize } = req.query;
    const result = await searchService.searchBusinesses(q, page, pageSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;