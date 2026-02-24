<template>
  <div class="admin-announcements">
    <h2>公告管理</h2>

    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新建公告</button>
      <select v-model="filterActive" @change="fetchData(true)" class="filter-select">
        <option value="">全部公告</option>
        <option value="true">仅显示启用</option>
        <option value="false">仅显示禁用</option>
      </select>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="item in list" :key="item.id" class="announcement-card">
          <div class="card-header">
            <div class="header-left">
              <h3>{{ item.title }}</h3>
              <span :class="['badge', item.is_active ? 'active' : 'inactive']">
                {{ item.is_active ? '启用' : '禁用' }}
              </span>
            </div>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>

          <div class="card-content">
            <p class="content-preview">{{ truncate(item.content, 120) }}</p>
            <div v-if="item.attachments?.length" class="attachments">
              <span class="attachment-icon">📎</span>
              <span>{{ item.attachments.length }} 个附件</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewDetail(item)" class="btn-text">查看全文</button>
            </div>
            <div class="footer-right">
              <button @click="editItem(item)" class="btn-icon" title="编辑">✏️</button>
              <button
                @click="toggleActive(item)"
                class="btn-icon"
                :class="{ warning: item.is_active }"
                :title="item.is_active ? '禁用' : '启用'"
              >
                {{ item.is_active ? '🔴' : '🟢' }}
              </button>
              <button @click="deleteItem(item)" class="btn-icon delete" title="删除">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingItem ? '编辑公告' : '新建公告' }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" required maxlength="200" />
          </div>
          <div class="form-group">
            <label>内容 <span class="required">*</span></label>
            <textarea v-model="form.content" rows="6" required></textarea>
          </div>
          <div class="form-group">
            <label>附件（可上传多个）</label>
            <div class="attachment-upload">
              <input type="file" multiple @change="handleAttachmentsUpload" />
              <div v-if="uploading" class="uploading">上传中...</div>
            </div>
            <div v-if="form.attachments && form.attachments.length" class="attachment-list">
              <div v-for="(url, idx) in form.attachments" :key="idx" class="attachment-item">
                <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
                <span class="remove" @click="removeAttachment(idx)">×</span>
              </div>
            </div>
          </div>
          <div class="form-group checkbox">
            <label>
              <input type="checkbox" v-model="form.is_active" />
              启用（发布后立即生效）
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 查看详情弹窗 -->
    <div v-if="viewDetailVisible" class="modal" @click.self="viewDetailVisible = false">
      <div class="modal-content">
        <h3>{{ viewDetailData.title }}</h3>
        <div class="content-view" v-html="viewDetailData.content.replace(/\n/g, '<br>')"></div>
        <div v-if="viewDetailData.attachments?.length" class="attachment-view">
          <h4>附件</h4>
          <ul>
            <li v-for="url in viewDetailData.attachments" :key="url">
              <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
            </li>
          </ul>
        </div>
        <div class="modal-actions">
          <button @click="viewDetailVisible = false" class="btn-primary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/announcement';
import { uploadFile } from '@/api/upload';
import { format } from 'date-fns';

const list = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const filterActive = ref('');

const showForm = ref(false);
const editingItem = ref(null);
const saving = ref(false);
const form = ref({
  title: '',
  content: '',
  attachments: [],
  is_active: true,
});

// 查看详情
const viewDetailVisible = ref(false);
const viewDetailData = ref({});

const uploading = ref(false);

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
      isActive: filterActive.value || undefined,
    };
    const res = await getAdminAnnouncements(params);
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

const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;
const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm');

const editItem = (item) => {
  editingItem.value = item;
  form.value = { ...item, attachments: item.attachments || [] };
  showForm.value = true;
};

const viewDetail = (item) => {
  viewDetailData.value = item;
  viewDetailVisible.value = true;
};

const handleAttachmentsUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  uploading.value = true;
  try {
    for (const file of files) {
      const res = await uploadFile(file);
      if (res.data.success) {
        form.value.attachments.push(res.data.url);
      } else {
        alert(`上传 ${file.name} 失败：` + res.data.error);
      }
    }
  } catch (err) {
    console.error('上传失败', err);
    alert('上传失败');
  } finally {
    uploading.value = false;
  }
};

const removeAttachment = (index) => {
  form.value.attachments.splice(index, 1);
};

const saveItem = async () => {
  saving.value = true;
  try {
    if (editingItem.value) {
      await updateAnnouncement(editingItem.value.id, form.value);
    } else {
      await createAnnouncement(form.value);
    }
    showForm.value = false;
    await fetchData(true);
  } catch (err) {
    console.error(err);
    alert('保存失败');
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (item) => {
  if (!confirm(`确定删除公告“${item.title}”吗？`)) return;
  try {
    await deleteAnnouncement(item.id);
    await fetchData(true);
  } catch (err) {
    console.error(err);
    alert('删除失败');
  }
};

const toggleActive = async (item) => {
  try {
    await updateAnnouncement(item.id, { is_active: !item.is_active });
    item.is_active = !item.is_active;
  } catch (err) {
    console.error(err);
    alert('操作失败');
  }
};

onMounted(() => fetchData(true));
</script>

<style scoped>
.admin-announcements {
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
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
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
  font-size: 18px;
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
.btn-icon.warning:hover {
  background-color: #fff3cd;
  color: #856404;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.announcement-card:hover {
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
  flex-wrap: wrap;
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
}
.badge.active {
  background-color: #d4edda;
  color: #155724;
}
.badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.card-time {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
}
.content-preview {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #495057;
  line-height: 1.6;
  word-break: break-word;
}

.attachments {
  font-size: 13px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
}
.attachment-icon {
  font-size: 14px;
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
.required {
  color: #dc3545;
}
.form-group input,
.form-group textarea,
.form-group select {
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

.attachment-upload {
  margin-bottom: 8px;
}
.uploading {
  font-size: 12px;
  color: #007bff;
  margin-top: 4px;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.attachment-item {
  display: inline-flex;
  align-items: center;
  background-color: #f1f3f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.attachment-item a {
  color: #007bff;
  text-decoration: none;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attachment-item .remove {
  margin-left: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #dc3545;
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
  max-height: 300px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
}
.attachment-view ul {
  margin: 8px 0 0;
  padding-left: 20px;
}
.attachment-view a {
  color: #007bff;
  text-decoration: none;
}
.attachment-view a:hover {
  text-decoration: underline;
}
</style>