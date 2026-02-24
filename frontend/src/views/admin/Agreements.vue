<template>
  <div class="admin-agreements">
    <h2>协议版本管理</h2>

    <!-- 类型切换选项卡 -->
    <div class="tabs">
      <span
        v-for="t in types"
        :key="t.value"
        :class="['tab', { active: currentType === t.value }]"
        @click="changeType(t.value)"
      >
        {{ t.label }}
      </span>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新增版本</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="item in agreements" :key="item.id" class="agreement-card">
          <div class="card-header">
            <div class="header-left">
              <h3>版本 {{ item.version }}</h3>
              <span v-if="item.is_current" class="badge current">当前版本</span>
              <span v-else class="badge">历史版本</span>
            </div>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>

          <div class="card-content">
            <p class="content-preview">{{ truncate(item.content, 120) }}</p>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewContent(item)" class="btn-text">查看全文</button>
            </div>
            <div class="footer-right">
              <button v-if="!item.is_current" @click="editItem(item)" class="btn-icon" title="编辑">✏️</button>
              <button v-if="!item.is_current" @click="setCurrent(item)" class="btn-icon" title="设为当前">⭐</button>
              <button v-if="!item.is_current" @click="deleteItem(item)" class="btn-icon delete" title="删除">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingItem ? '编辑协议' : '新增协议' }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label>版本号</label>
            <input v-model="form.version" required />
          </div>
          <div class="form-group">
            <label>协议内容</label>
            <textarea v-model="form.content" rows="8" required></textarea>
          </div>
          <div class="form-group checkbox">
            <label>
              <input type="checkbox" v-model="form.is_current" />
              设为当前版本
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 查看内容弹窗 -->
    <div v-if="viewContentVisible" class="modal" @click.self="viewContentVisible = false">
      <div class="modal-content">
        <h3>协议内容</h3>
        <div class="content-view" v-html="viewContentText"></div>
        <div class="modal-actions">
          <button @click="viewContentVisible = false" class="btn-primary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAgreements, createAgreement, updateAgreement, deleteAgreement, setCurrentAgreement } from '@/api/admin';
import { format } from 'date-fns';

const types = [
  { value: 'user', label: '用户协议' },
  { value: 'privacy', label: '隐私政策' },
  { value: 'community', label: '社区规范' }
];
const currentType = ref('user');

const agreements = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);
const pageSize = 20;

const showForm = ref(false);
const editingItem = ref(null);
const saving = ref(false);
const viewContentVisible = ref(false);
const viewContentText = ref('');

const form = ref({
  type: 'user',
  version: '',
  content: '',
  is_current: false
});

const fetchAgreements = async (reset = false) => {
  if (reset) {
    page.value = 1;
    agreements.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getAgreements({ 
      type: currentType.value, 
      page: page.value, 
      pageSize 
    });

    // 处理响应数据
    let list = [];
    let total = 0;

    if (res.data && res.data.success === false) {
      // 如果返回错误
      console.error('后端返回错误:', res.data.error);
      list = [];
      total = 0;
    } else if (res.data && Array.isArray(res.data)) {
      // 如果直接返回数组
      list = res.data;
      total = list.length;
      hasMore.value = false; // 无分页时停止加载更多
    } else if (res.data && res.data.list && Array.isArray(res.data.list)) {
      // 期望的标准分页格式
      list = res.data.list;
      total = res.data.total || list.length;
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      // 某些接口可能返回 { data: [...] }
      list = res.data.data;
      total = list.length;
      hasMore.value = false;
    } else {
      console.error('未知的响应格式:', res.data);
      list = [];
      total = 0;
    }

    agreements.value.push(...list);
    hasMore.value = agreements.value.length < total;
    page.value++;
  } catch (err) {
    console.error('获取协议失败', err);
  } finally {
    loading.value = false;
  }
};

const changeType = (type) => {
  currentType.value = type;
  form.value.type = type;
  fetchAgreements(true);
};

const editItem = (item) => {
  editingItem.value = item;
  form.value = { ...item };
  showForm.value = true;
};

const saveItem = async () => {
  saving.value = true;
  try {
    if (editingItem.value) {
      await updateAgreement(editingItem.value.id, form.value);
    } else {
      await createAgreement(form.value);
    }
    showForm.value = false;
    fetchAgreements(true);
  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (item) => {
  if (!confirm(`确定删除版本 ${item.version} 吗？`)) return;
  try {
    await deleteAgreement(item.id);
    fetchAgreements(true);
  } catch (err) {
    console.error(err);
  }
};

const setCurrent = async (item) => {
  if (!confirm(`确定将版本 ${item.version} 设为当前版本吗？`)) return;
  try {
    await setCurrentAgreement(item.id, { is_current: true, type: currentType.value });
    fetchAgreements(true);
  } catch (err) {
    console.error(err);
  }
};

const viewContent = (item) => {
  viewContentText.value = item.content.replace(/\n/g, '<br>');
  viewContentVisible.value = true;
};

const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;
const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm');
const loadMore = () => fetchAgreements();

onMounted(() => fetchAgreements(true));
</script>

<style scoped>
.admin-agreements {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 选项卡样式 */
.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 12px;
}

.tab {
  padding: 6px 16px;
  border-radius: 20px;
  cursor: pointer;
  color: #6c757d;
  font-size: 14px;
  transition: all 0.2s;
}
.tab.active {
  background-color: #007bff;
  color: white;
}
.tab:hover:not(.active) {
  background-color: #e9ecef;
}

/* 工具栏 */
.toolbar {
  margin-bottom: 24px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #0056b3;
}
.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-secondary:hover {
  background-color: #5a6268;
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

.btn-icon {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-icon:hover {
  background-color: #f1f3f5;
}
.btn-icon.delete:hover {
  background-color: #f8d7da;
  color: #dc3545;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agreement-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.agreement-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: #e9ecef;
  color: #495057;
}
.badge.current {
  background-color: #28a745;
  color: white;
}

.card-time {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
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

.footer-right {
  display: flex;
  gap: 8px;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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

.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-group textarea {
  font-family: inherit;
  resize: vertical;
}
.form-group.checkbox {
  display: flex;
  align-items: center;
}
.form-group.checkbox input {
  width: auto;
  margin-right: 8px;
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
.modal-actions .btn-primary {
  background-color: #007bff;
  color: white;
}
.modal-actions .btn-secondary {
  background-color: #6c757d;
  color: white;
}

.content-view {
  white-space: pre-wrap;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
}
</style>