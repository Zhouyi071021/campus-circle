const supabase = require('../utils/supabase');

// 计算上周的用户活跃度排名（发帖+评论+点赞）
async function calculateUserRankings() {
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 6); // 上周一
  lastWeekStart.setHours(0,0,0,0);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  lastWeekEnd.setHours(23,59,59,999);

  // 查询上周每个用户的发帖数
  const { data: posts, error: postErr } = await supabase
    .from('posts')
    .select('user_id, count')
    .gte('created_at', lastWeekStart.toISOString())
    .lte('created_at', lastWeekEnd.toISOString())
    .group_by('user_id');
  // 类似地，评论和点赞也需要聚合。由于复杂，可以用SQL函数或分步处理。
  // 简化：使用原始SQL或视图。这里我们使用Supabase的rpc调用自定义函数。

  // 我们可以在Supabase中创建一个函数来计算用户得分
  // 但为了示例，我们假设已有函数或手动计算。
}

// 计算上周热门帖子
async function calculatePostRankings() {
  // 按点赞数+评论数排序
}

// 计算上周热门学校（活跃用户数）
async function calculateSchoolRankings() {
  // 根据上周有发帖或评论的用户所在学校计数
}

// 存储结果到weekly_rankings
async function saveRankings(type, rankings) {
  // 删除上周同类型数据
  await supabase.from('weekly_rankings').delete().eq('type', type);
  // 插入新数据
  const inserts = rankings.map((item, index) => ({
    type,
    rank: index + 1,
    target_id: item.id,
    target_name: item.name,
    score: item.score,
    week_start: lastWeekStart,
  }));
  await supabase.from('weekly_rankings').insert(inserts);
}

module.exports = {
  calculateUserRankings,
  calculatePostRankings,
  calculateSchoolRankings,
};