<template>
  <div class="admin-music">
    <h2>背景音乐管理</h2>

    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新增音乐</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="item in musicList" :key="item.id" class="music-card">
          <div class="card-header">
            <img :src="item.cover_url" class="cover" />
            <div class="header-info">
              <h3>{{ item.title }}</h3>
              <span class="artist">{{ item.artist || '未知艺术家' }}</span>
              <span :class="['badge', item.status === 'active' ? 'active' : 'inactive']">
                {{ item.status === 'active' ? '启用' : '禁用' }}
              </span>
            </div>
          </div>

          <div class="card-content">
            <div class="info-row">
              <span class="label">分类：</span>
              <span class="value">{{ item.category || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">排序：</span>
              <span class="value">{{ item.sort_order }}</span>
            </div>
            <div class="info-row">
              <span class="label">音乐URL：</span>
              <a :href="item.url" target="_blank" class="url-link">{{ truncate(item.url, 50) }}</a>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="playMusic(item)" class="btn-play" title="试听">▶ 试听</button>
            </div>
            <div class="footer-right">
              <button @click="editItem(item)" class="btn-icon" title="编辑">✏️</button>
              <button @click="deleteItem(item)" class="btn-icon delete" title="删除">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingItem ? '编辑音乐' : '新增音乐' }}</h3>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label>标题</label>
            <input v-model="form.title" required />
          </div>
          <div class="form-group">
            <label>艺术家</label>
            <input v-model="form.artist" />
          </div>
          <div class="form-group">
            <label>音乐URL</label>
            <input v-model="form.url" required />
          </div>
          <div class="form-group">
            <label>封面URL</label>
            <input v-model="form.cover_url" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <input v-model="form.category" />
          </div>
          <div class="form-group">
            <label>排序</label>
            <input type="number" v-model.number="form.sort_order" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status">
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMusicList, createMusic, updateMusic, deleteMusic } from '@/api/admin';

const musicList = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingItem = ref(null);
const saving = ref(false);

const form = ref({
  title: '',
  artist: '',
  url: '',
  cover_url: '',
  category: '',
  sort_order: 0,
  status: 'active'
});

const fetchMusic = async () => {
  loading.value = true;
  try {
    const res = await getMusicList();
    musicList.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
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
      await updateMusic(editingItem.value.id, form.value);
    } else {
      await createMusic(form.value);
    }
    showForm.value = false;
    await fetchMusic();
  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (item) => {
  if (!confirm(`确定删除音乐“${item.title}”吗？`)) return;
  try {
    await deleteMusic(item.id);
    await fetchMusic();
  } catch (err) {
    console.error(err);
  }
};

const playMusic = (item) => {
  window.open(item.url, '_blank');
};

const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;

onMounted(() => {
  fetchMusic();
});
</script>

<style scoped>
.admin-music {
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

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.music-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.music-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.header-info {
  flex: 1;
}
.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 500;
}
.artist {
  font-size: 14px;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
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

.card-content {
  margin-bottom: 16px;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.info-row {
  font-size: 14px;
  margin-bottom: 6px;
  color: #495057;
}
.label {
  color: #6c757d;
  font-weight: 500;
}
.value {
  color: #212529;
  margin-left: 4px;
}
.url-link {
  color: #007bff;
  text-decoration: none;
}
.url-link:hover {
  text-decoration: underline;
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

.btn-play {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-play:hover {
  background-color: #218838;
}

.footer-right {
  display: flex;
  gap: 8px;
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
  width: 500px;
  max-width: 90%;
}
.modal-content h3 {
  margin-top: 0;
  font-size: 18px;
  font-weight: 500;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #495057;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-primary {
  background-color: #007bff;
  color: white;
}
</style>