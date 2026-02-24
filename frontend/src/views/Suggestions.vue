<template>
  <div class="suggestions-container">
    <header class="suggestions-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>建议箱</h2>
      <button @click="showForm = true" class="new-btn">+</button>
    </header>

    <!-- 提交表单（弹窗） -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>提交建议</h3>
        <form @submit.prevent="submitSuggestion">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input type="text" v-model="form.title" maxlength="200" required />
          </div>
          <div class="form-group">
            <label>内容 <span class="required">*</span></label>
            <textarea v-model="form.content" rows="4" maxlength="5000" required></textarea>
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="form.type">
              <option value="">请选择</option>
              <option value="功能建议">功能建议</option>
              <option value="内容投诉">内容投诉</option>
              <option value="合作咨询">合作咨询</option>
            </select>
          </div>
          <div class="form-group">
            <label>附件（最多3个）</label>
            <input type="file" multiple @change="handleFileUpload" />
            <div v-if="form.attachments.length" class="file-list">
              <div v-for="(file, idx) in form.attachments" :key="idx" class="file-item">
                {{ file.name }}
                <span @click="removeFile(idx)" class="remove">×</span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false">取消</button>
            <button type="submit" :disabled="submitting">提交</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 历史建议列表 -->
    <div class="suggestions-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="suggestions.length === 0" class="empty">
        暂无建议，点击右上角提交～
      </div>
      <div v-for="item in suggestions" :key="item.id" class="suggestion-card" @click="viewDetail(item.id)">
        <div class="card-header">
          <span class="title">{{ item.title }}</span>
          <span class="status" :class="item.status">{{ statusText(item.status) }}</span>
        </div>
        <p class="content">{{ truncate(item.content, 50) }}</p>
        <div class="meta">
          <span class="time">{{ formatTime(item.created_at) }}</span>
          <span v-if="item.reply" class="replied">有回复</span>
        </div>
      </div>
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMySuggestions, createSuggestion } from '@/api/suggestion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const suggestions = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const showForm = ref(false);
const submitting = ref(false);
const form = ref({
  title: '',
  content: '',
  type: '',
  attachments: []
});

const fetchSuggestions = async (reset = false) => {
  if (reset) {
    page.value = 1;
    suggestions.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getMySuggestions(page.value, pageSize);
    const { list, total } = res.data;
    suggestions.value.push(...list);
    hasMore.value = suggestions.value.length < total;
    page.value++;
  } catch (err) {
    console.error('获取建议失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchSuggestions();

const submitSuggestion = async () => {
  // 附件上传省略，实际应上传到云存储获取URL
  submitting.value = true;
  try {
    // 模拟上传附件得到URL，这里直接传文件名占位
    const attachments = form.value.attachments.map(f => f.name);
    await createSuggestion({
      title: form.value.title,
      content: form.value.content,
      type: form.value.type,
      attachments
    });
    showForm.value = false;
    // 重置表单
    form.value = { title: '', content: '', type: '', attachments: [] };
    fetchSuggestions(true);
  } catch (err) {
    console.error('提交失败', err);
    alert('提交失败');
  } finally {
    submitting.value = false;
  }
};

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  if (form.value.attachments.length + files.length > 3) {
    alert('最多上传3个附件');
    return;
  }
  form.value.attachments.push(...files);
};

const removeFile = (idx) => {
  form.value.attachments.splice(idx, 1);
};

const statusText = (status) => {
  const map = { pending: '待处理', replied: '已回复', closed: '已关闭' };
  return map[status] || status;
};

const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;
const formatTime = (ts) => formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN });
const viewDetail = (id) => router.push(`/suggestions/${id}`);
const goBack = () => router.back();

onMounted(() => {
  fetchSuggestions(true);
});
</script>

<style scoped>
.suggestions-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.new-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-content h3 {
  margin-top: 0;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.required { color: #dc3545; }
.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  box-sizing: border-box;
}
.file-list {
  margin-top: 8px;
}
.file-item {
  display: flex;
  justify-content: space-between;
  background-color: #f1f3f5;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
}
.remove {
  color: #dc3545;
  cursor: pointer;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}
.modal-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.modal-actions button[type="submit"] {
  background-color: #007bff;
  color: white;
}
.suggestions-list {
  padding: 12px;
}
.suggestion-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.title {
  font-weight: 600;
  font-size: 16px;
}
.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #e9ecef;
}
.status.pending { background-color: #fff3cd; color: #856404; }
.status.replied { background-color: #d1ecf1; color: #0c5460; }
.content {
  color: #495057;
  margin-bottom: 8px;
  font-size: 14px;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}
.replied { color: #007bff; }
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>