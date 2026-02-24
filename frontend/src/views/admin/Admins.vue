<template>
  <div class="admin-admins">
    <h2>管理员管理</h2>

    <!-- 卡片列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <div class="card-list">
        <div v-for="item in admins" :key="item.id" class="admin-card">
          <div class="card-header">
            <div class="user-info">
              <img :src="item.avatar_url" class="avatar" />
              <div>
                <h3>{{ item.username }}</h3>
                <span class="role-badge" :class="item.role">
                  {{ item.role === 'super_admin' ? '超级管理员' : '管理员' }}
                </span>
              </div>
            </div>
            <span class="user-id">ID: {{ item.id }}</span>
          </div>

          <div class="card-actions">
            <button v-if="item.role !== 'super_admin'" @click="removeAdmin(item)" class="btn-danger">移除</button>
            <span v-else class="disabled-text">不可操作</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加管理员区域 -->
    <div class="add-admin-section">
      <h3>添加管理员</h3>
      <div class="form-row">
        <select v-model="selectedUser" class="form-select">
          <option value="">选择用户</option>
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
        </select>
        <select v-model="selectedRole" class="form-select">
          <option value="admin">管理员</option>
          <option value="super_admin">超级管理员</option>
        </select>
        <button @click="handleAddAdmin" :disabled="!selectedUser || !selectedRole" class="btn-primary">
          添加
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdmins, removeAdmin as apiRemoveAdmin, addAdmin, searchUsers } from '@/api/admin';

const admins = ref([]);
const loading = ref(false);
const selectedUser = ref('');
const selectedRole = ref('admin');
const users = ref([]);

const fetchAdmins = async () => {
  loading.value = true;
  try {
    const res = await getAdmins();
    admins.value = res.data.data;
  } catch (err) {
    console.error('获取管理员列表失败', err);
  } finally {
    loading.value = false;
  }
};

const removeAdmin = async (item) => {
  if (!confirm(`确定将 ${item.username} 移出管理员吗？`)) return;
  try {
    await apiRemoveAdmin(item.id);
    admins.value = admins.value.filter(a => a.id !== item.id);
  } catch (err) {
    alert('操作失败');
  }
};

const fetchUsers = async () => {
  try {
    const res = await searchUsers({ role: 'user' });
    users.value = res.data.list || res.data.data || [];
  } catch (err) {
    console.error('获取用户列表失败', err);
  }
};

const handleAddAdmin = async () => {
  if (!selectedUser.value || !selectedRole.value) return;
  try {
    await addAdmin({ userId: selectedUser.value, role: selectedRole.value });
    alert('添加成功');
    selectedUser.value = '';
    selectedRole.value = 'admin';
    await fetchAdmins();
    await fetchUsers();
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.error || err.message));
  }
};

onMounted(() => {
  fetchAdmins();
  fetchUsers();
});
</script>

<style scoped>
.admin-admins {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s;
}
.admin-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}
.role-badge.admin {
  background-color: #e7f3ff;
  color: #007bff;
}
.role-badge.super_admin {
  background-color: #fff3cd;
  color: #856404;
}

.user-id {
  font-size: 12px;
  color: #6c757d;
  margin-left: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-danger:hover {
  background-color: #c82333;
}

.disabled-text {
  color: #6c757d;
  font-size: 14px;
  font-style: italic;
}

.add-admin-section {
  margin-top: 40px;
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.add-admin-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 500;
}

.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.form-select {
  flex: 1 1 200px;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
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

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>