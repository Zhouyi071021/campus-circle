<template>
  <div class="login-history-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>登录记录</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="history.length === 0" class="empty">暂无登录记录</div>
      <div v-else>
        <div v-for="item in history" :key="item.id" class="history-item">
          <div class="device-info">
            <span class="device">{{ item.device || '未知设备' }}</span>
            <span class="ip">{{ item.ip }}</span>
          </div>
          <div class="time">{{ formatTime(item.created_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getLoginHistory } from '@/api/settings';
import { format } from 'date-fns';

const router = useRouter();
const history = ref([]);
const loading = ref(false);

const fetchHistory = async () => {
  loading.value = true;
  try {
    const res = await getLoginHistory();
    history.value = res.data.data;
  } catch (err) {
    console.error('获取登录记录失败', err);
  } finally {
    loading.value = false;
  }
};

const formatTime = (ts) => format(new Date(ts), 'yyyy-MM-dd HH:mm:ss');

const goBack = () => router.back();

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.login-history-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 16px;
}
.content {
  padding: 16px;
}
.history-item {
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.device-info {
  display: flex;
  flex-direction: column;
}
.device {
  font-weight: 500;
}
.ip {
  font-size: 12px;
  color: #6c757d;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>