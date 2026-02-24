const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 使用 service_role 客户端（需在 .env 中配置）
const { createClient } = require('@supabase/supabase-js');
const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: '未提供文件' });
    }

    const ext = file.originalname.split('.').pop();
    const fileName = `posts/${uuidv4()}.${ext}`;

    // 设置上传选项
    const options = {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    };

    // 非图片文件强制下载
    if (!file.mimetype.startsWith('image/')) {
      options.contentDisposition = 'attachment';
    }

    const { data, error } = await supabaseService.storage
      .from('files')
      .upload(fileName, file.buffer, options);

    if (error) throw error;

    const { data: urlData } = supabaseService.storage
      .from('files')
      .getPublicUrl(fileName);

    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;