const express = require('express');
const router = express.Router();
const sponsorService = require('../services/sponsorService');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await sponsorService.getPublicSponsors(limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;