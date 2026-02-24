<template>
  <div class="admin-logs">
    <h2>操作日志</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="log in logs" :key="log.id" class="log-card">
          <div class="card-header">
            <div class="admin-info">
              <img :src="log.admin?.avatar_url || '/default-avatar.png'" class="avatar" />
              <div>
                <span class="username">{{ log.admin?.username }}</span>
                <span class="log-id">ID: {{ log.id }}</span>
              </div>
            </div>
            <span class="log-time">{{ formatDate(log.created_at) }}</span>
          </div>
          <div class="card-content">
            <div class="log-action">{{ log.action }}</div>
            <div class="log-ip">IP: {{ log.ip }}</div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminLogs } from '@/api/admin';
import { format } from 'date-fns';

const logs = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchLogs = async (reset = false) => {
  if (reset) {
    page.value = 1;
    logs.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getAdminLogs(page.value, pageSize);
    logs.value.push(...res.data.list);
    hasMore.value = logs.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchLogs();
const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm:ss');

onMounted(() => fetchLogs(true));
</script>

<style scoped>
.admin-logs {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.log-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  font-size: 16px;
  color: #212529;
  display: block;
}

.log-id {
  font-size: 12px;
  color: #6c757d;
}

.log-time {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 8px;
}

.log-action {
  font-size: 15px;
  line-height: 1.6;
  color: #212529;
  word-break: break-word;
  white-space: pre-wrap;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.log-ip {
  font-size: 13px;
  color: #6c757d;
  padding-left: 4px;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}
.load-more:hover {
  text-decoration: underline;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>