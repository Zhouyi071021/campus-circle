<template>
  <div class="admin-ads">
    <h2>广告位管理</h2>
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新增广告</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>位置</th>
            <th>标题</th>
            <th>图片</th>
            <th>排序</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ad in ads" :key="ad.id">
            <td>{{ ad.id }}</td>
            <td>{{ ad.position }}</td>
            <td>{{ ad.title }}</td>
            <td><img :src="ad.image_url" class="ad-image" /></td>
            <td>{{ ad.sort_order }}</td>
            <td>
              <span :class="'badge ' + (ad.status === 'active' ? 'active' : 'inactive')">
                {{ ad.status === 'active' ? '启用' : '禁用' }}
              </span>
            </td>
            <td>
              <button @click="editAd(ad)">编辑</button>
              <button @click="handleDeleteAd(ad)" class="danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingAd ? '编辑广告' : '新增广告' }}</h3>
        <form @submit.prevent="saveAd">
          <div class="form-group">
            <label>位置</label>
            <select v-model="form.position" required>
              <option value="home_top">首页顶部</option>
              <option value="home_middle">首页中部</option>
              <option value="post_detail">帖子详情页</option>
            </select>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input v-model="form.title" required />
          </div>
          <div class="form-group">
            <label>图片URL</label>
            <input v-model="form.image_url" required />
          </div>
          <div class="form-group">
            <label>链接</label>
            <input v-model="form.link" />
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
            <button type="button" @click="showForm = false">取消</button>
            <button type="submit" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAds, createAd, updateAd, deleteAd as deleteAdApi } from '@/api/admin';

const ads = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingAd = ref(null);
const saving = ref(false);
const form = ref({
  position: 'home_top',
  title: '',
  image_url: '',
  link: '',
  sort_order: 0,
  status: 'active',
});

const fetchAds = async () => {
  loading.value = true;
  try {
    const res = await getAds();
    ads.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const editAd = (ad) => {
  editingAd.value = ad;
  form.value = { ...ad };
  showForm.value = true;
};

const saveAd = async () => {
  saving.value = true;
  try {
    if (editingAd.value) {
      await updateAd(editingAd.value.id, form.value);
    } else {
      await createAd(form.value);
    }
    showForm.value = false;
    await fetchAds();
  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const handleDeleteAd = async (ad) => {
  if (!confirm(`确定删除广告“${ad.title}”吗？`)) return;
  try {
    await deleteAdApi(ad.id);
    await fetchAds();
  } catch (err) {
    console.error(err);
  }
};

onMounted(fetchAds);
</script>

<style scoped>
.admin-ads {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
.table th, .table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
}
.ad-image {
  width: 80px;
  height: 40px;
  object-fit: cover;
}
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.active {
  background-color: #d4edda;
  color: #155724;
}
.inactive {
  background-color: #f8d7da;
  color: #721c24;
}
button {
  padding: 4px 8px;
  margin-right: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}
.danger {
  background-color: #dc3545;
}
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
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
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
}
.modal-actions button {
  padding: 8px 16px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>