const express = require('express');
const router = express.Router();
const districtService = require('../services/districtService');

// 获取所有县区
router.get('/counties', async (req, res) => {
  try {
    const data = await districtService.getCounties();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 根据县区ID获取区域
router.get('/districts/:countyId', async (req, res) => {
  try {
    const { countyId } = req.params;
    const data = await districtService.getDistrictsByCounty(countyId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 根据区域ID获取学校
router.get('/schools/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params;
    const data = await districtService.getSchoolsByDistrict(districtId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;