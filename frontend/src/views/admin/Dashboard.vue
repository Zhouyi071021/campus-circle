<template>
  <div class="admin-dashboard">
    <h2>仪表盘</h2>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.newUsers }}</div>
          <div class="stat-label">今日新用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.newPosts }}</div>
          <div class="stat-label">今日新帖</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏘️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingCommunities }}</div>
          <div class="stat-label">待审核社区</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingBusiness }}</div>
          <div class="stat-label">待审核商家</div>
        </div>
      </div>
    </div>

    <!-- 超级管理员可见趋势 -->
    <div v-if="isSuperAdmin" class="trends-section">
      <h3>近7天趋势</h3>
      <div class="trend-grid">
        <div class="trend-card">
          <h4>新用户</h4>
          <p>{{ trends.users7d }}</p>
        </div>
        <div class="trend-card">
          <h4>新帖子</h4>
          <p>{{ trends.posts7d }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAdminStats, getAdminTrends } from '@/api/admin';
import { useUserStore } from '@/stores/user';

const stats = ref({});
const trends = ref({});
const userStore = useUserStore();
const isSuperAdmin = computed(() => userStore.user?.value?.role === 'super_admin');

onMounted(async () => {
  const statsRes = await getAdminStats();
  stats.value = statsRes.data.data;
  if (isSuperAdmin.value) {
    const trendsRes = await getAdminTrends();
    trends.value = trendsRes.data.data;
  }
});
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 40px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #007bff;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
}

/* 趋势部分 */
.trends-section {
  margin-top: 40px;
}
.trends-section h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 500;
  color: #212529;
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.trend-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.trend-card h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #6c757d;
  font-weight: 500;
}
.trend-card p {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: #007bff;
}
</style>