const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const supabase = require('./utils/supabase'); // 引入 supabase 客户端

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 允许的域名列表
const allowedOrigins = [
  'http://localhost:5173',
  'https://campus-circle-nine.vercel.app' // 替换为您实际的前端域名（去掉尾随斜杠）
];

// ✅ CORS 中间件（只配置一次）
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// ✅ 根路由
app.get('/', (req, res) => {
  res.send('校园圈后端 API 运行中 🚀');
});

// ✅ 挂载 API 路由
const postRoutes = require('./routes/postRoutes');
const districtRoutes = require('./routes/districtRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const communityRoutes = require('./routes/communityRoutes');
const businessRoutes = require('./routes/businessRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const searchRoutes = require('./routes/searchRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const musicRoutes = require('./routes/musicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const businessApplicationRoutes = require('./routes/businessApplicationRoutes');
const uploadRoutes = require('./routes/upload');
const announcementRoutes = require('./routes/announcementRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/api/comments', commentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/business-applications', businessApplicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/users', userRoutes);
app.use('/api/music', musicRoutes);

// ✅ 测试数据库连接
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ success: true, message: 'Supabase 连接成功', count: data });
  } catch (err) {
    console.error('❌ Supabase 查询失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ 定时清理任务
cron.schedule('0 3 * * *', async () => {
  console.log('执行数据库清理任务...');
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    await supabase
      .from('posts')
      .delete()
      .eq('status', 'deleted')
      .lt('updated_at', weekAgo.toISOString());

    await supabase
      .from('posts')
      .delete()
      .eq('status', 'deleted')
      .lt('updated_at', monthAgo.toISOString());

    console.log('清理完成');
  } catch (err) {
    console.error('清理任务失败', err);
  }
});

// ✅ 仅在本地开发时监听端口
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

// ✅ 导出 app 供 Vercel 使用
module.exports = app;