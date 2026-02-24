<template>
  <div class="suggestion-detail-container">
    <header class="detail-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>建议详情</h2>
    </header>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!suggestion" class="empty">建议不存在</div>
    <div v-else class="detail-content">
      <div class="suggestion-card">
        <div class="header">
          <span class="title">{{ suggestion.title }}</span>
          <span class="status" :class="suggestion.status">{{ statusText(suggestion.status) }}</span>
        </div>
        <p class="content">{{ suggestion.content }}</p>
        <div v-if="suggestion.attachments && suggestion.attachments.length" class="attachments">
          <h4>附件</h4>
          <div v-for="(att, idx) in suggestion.attachments" :key="idx" class="attachment-item">
            📎 {{ att }}
          </div>
        </div>
        <div class="meta">
          <span class="type">{{ suggestion.type || '未分类' }}</span>
          <span class="time">{{ formatTime(suggestion.created_at) }}</span>
        </div>
      </div>

      <!-- 站长回复 -->
      <div v-if="suggestion.reply" class="reply-card">
        <h4>站长回复</h4>
        <p class="reply-content">{{ suggestion.reply }}</p>
        <span class="reply-time">{{ formatTime(suggestion.replied_at) }}</span>
      </div>
      <div v-else-if="suggestion.status === 'pending'" class="no-reply">
        等待站长回复...
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSuggestion } from '@/api/suggestion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const suggestion = ref(null);
const loading = ref(true);

const fetchSuggestion = async () => {
  try {
    const id = route.params.id;
    const res = await getSuggestion(id);
    suggestion.value = res.data.data;
  } catch (err) {
    console.error('获取建议详情失败', err);
  } finally {
    loading.value = false;
  }
};

const statusText = (status) => {
  const map = { pending: '待处理', replied: '已回复', closed: '已关闭' };
  return map[status] || status;
};

const formatTime = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';
const goBack = () => router.back();

onMounted(() => {
  fetchSuggestion();
});
</script>

<style scoped>
.suggestion-detail-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.detail-header {
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
.detail-content {
  padding: 16px;
}
.suggestion-card, .reply-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: #e9ecef;
}
.status.pending { background-color: #fff3cd; color: #856404; }
.status.replied { background-color: #d1ecf1; color: #0c5460; }
.content {
  font-size: 16px;
  line-height: 1.6;
  color: #212529;
  margin-bottom: 16px;
  white-space: pre-wrap;
}
.attachments {
  margin-bottom: 16px;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}
.attachments h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #6c757d;
}
.attachment-item {
  font-size: 14px;
  color: #007bff;
  margin-bottom: 4px;
  cursor: pointer;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}
.reply-card h4 {
  margin: 0 0 8px 0;
  color: #28a745;
}
.reply-content {
  font-size: 15px;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}
.reply-time {
  font-size: 12px;
  color: #6c757d;
}
.no-reply {
  text-align: center;
  color: #6c757d;
  padding: 20px;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>