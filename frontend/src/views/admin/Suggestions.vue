<template>
  <div class="admin-suggestions">
    <h2>建议管理</h2>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <select v-model="filterStatus" @change="fetchData(true)" class="filter-select">
        <option value="">全部</option>
        <option value="pending">待处理</option>
        <option value="replied">已回复</option>
        <option value="closed">已关闭</option>
      </select>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="item in list" :key="item.id" class="suggestion-card">
          <div class="card-header">
            <div class="user-info">
              <img :src="item.user?.avatar_url || '/default-avatar.png'" class="avatar" />
              <div>
                <span class="username">{{ item.user?.username }}</span>
                <span class="user-id">ID: {{ item.user?.id }}</span>
              </div>
            </div>
            <div class="header-right">
              <span :class="['badge', item.status]">{{ statusText(item.status) }}</span>
              <span class="card-time">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>

          <div class="card-content">
            <div class="title-row">
              <h3>{{ item.title }}</h3>
              <span class="type-tag">{{ item.type || '未分类' }}</span>
            </div>
            <p class="content-preview">{{ truncate(item.content, 150) }}</p>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewDetail(item)" class="btn-text">查看详情</button>
            </div>
            <div class="footer-right">
              <button v-if="item.status === 'pending'" @click="openReply(item)" class="btn-reply">回复</button>
              <button v-if="item.status !== 'closed'" @click="closeItem(item)" class="btn-close">关闭</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <!-- 查看详情弹窗 -->
    <div v-if="showDetail" class="modal" @click.self="showDetail = false">
      <div class="modal-content">
        <h3>{{ currentDetail.title }}</h3>
        <div class="modal-body">
          <p><strong>用户：</strong>{{ currentDetail.user?.username }}</p>
          <p><strong>类型：</strong>{{ currentDetail.type || '-' }}</p>
          <p><strong>状态：</strong><span :class="['badge', currentDetail.status]">{{ statusText(currentDetail.status) }}</span></p>
          <p><strong>提交时间：</strong>{{ formatDate(currentDetail.created_at) }}</p>
          <p><strong>内容：</strong></p>
          <div class="content-view">{{ currentDetail.content }}</div>
          <div v-if="currentDetail.attachments?.length" class="attachments">
            <strong>附件：</strong>
            <ul>
              <li v-for="url in currentDetail.attachments" :key="url">
                <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
              </li>
            </ul>
          </div>
          <div v-if="currentDetail.reply" class="reply-view">
            <strong>站长回复：</strong>
            <p>{{ currentDetail.reply }}</p>
            <p class="replied-at">回复时间：{{ formatDate(currentDetail.replied_at) }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showDetail = false" class="btn-primary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 回复弹窗 -->
    <div v-if="showReplyModal" class="modal" @click.self="showReplyModal = false">
      <div class="modal-content">
        <h3>回复建议</h3>
        <p><strong>{{ replyItem.title }}</strong></p>
        <textarea v-model="replyContent" rows="5" placeholder="请输入回复内容"></textarea>
        <div class="modal-actions">
          <button @click="showReplyModal = false" class="btn-secondary">取消</button>
          <button @click="submitReply" :disabled="replying" class="btn-primary">{{ replying ? '提交中...' : '提交回复' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminSuggestions, replySuggestion, closeSuggestion } from '@/api/suggestion';
import { format } from 'date-fns';

const list = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const filterStatus = ref('');

const showDetail = ref(false);
const currentDetail = ref({});

const showReplyModal = ref(false);
const replyItem = ref({});
const replyContent = ref('');
const replying = ref(false);

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1;
    list.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize,
      status: filterStatus.value || undefined,
    };
    const res = await getAdminSuggestions(params);
    list.value.push(...res.data.list);
    hasMore.value = list.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchData();

const formatDate = (d) => d ? format(new Date(d), 'yyyy-MM-dd HH:mm') : '';
const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;
const statusText = (status) => {
  const map = { pending: '待处理', replied: '已回复', closed: '已关闭' };
  return map[status] || status;
};

const viewDetail = (item) => {
  currentDetail.value = item;
  showDetail.value = true;
};

const openReply = (item) => {
  replyItem.value = item;
  replyContent.value = '';
  showReplyModal.value = true;
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;
  replying.value = true;
  try {
    await replySuggestion(replyItem.value.id, replyContent.value);
    showReplyModal.value = false;
    await fetchData(true);
  } catch (err) {
    console.error(err);
    alert('回复失败');
  } finally {
    replying.value = false;
  }
};

const closeItem = async (item) => {
  if (!confirm('确定关闭该建议吗？')) return;
  try {
    await closeSuggestion(item.id);
    await fetchData(true);
  } catch (err) {
    console.error(err);
    alert('关闭失败');
  }
};

onMounted(() => fetchData(true));
</script>

<style scoped>
.admin-suggestions {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 工具栏 */
.toolbar {
  margin-bottom: 24px;
}
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  width: 200px;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.suggestion-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
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
.user-id {
  font-size: 12px;
  color: #6c757d;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.badge.pending {
  background-color: #fff3cd;
  color: #856404;
}
.badge.replied {
  background-color: #d1ecf1;
  color: #0c5460;
}
.badge.closed {
  background-color: #e2e3e5;
  color: #383d41;
}

.card-time {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.title-row h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.type-tag {
  font-size: 12px;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  color: #495057;
}

.content-preview {
  margin: 0;
  font-size: 14px;
  color: #495057;
  line-height: 1.6;
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.btn-text:hover {
  text-decoration: underline;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-reply {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-reply:hover {
  background-color: #218838;
}

.btn-close {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-close:hover {
  background-color: #5a6268;
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

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-content h3 {
  margin-top: 0;
  font-size: 20px;
  font-weight: 500;
}
.modal-body {
  margin: 16px 0;
}
.modal-body p {
  margin: 4px 0;
}
.content-view {
  white-space: pre-wrap;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
}
.attachments ul {
  margin: 4px 0;
  padding-left: 20px;
}
.reply-view {
  background-color: #d1ecf1;
  padding: 12px;
  border-radius: 8px;
  margin-top: 12px;
}
.replied-at {
  font-size: 12px;
  color: #0c5460;
  margin-top: 4px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
.modal-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary {
  background-color: #007bff;
  color: white;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  margin: 8px 0;
  box-sizing: border-box;
  resize: vertical;
}
</style>