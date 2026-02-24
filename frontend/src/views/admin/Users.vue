<template>
  <div class="admin-users">
    <h2>用户管理</h2>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <input v-model="search" placeholder="搜索用户名" @keyup.enter="searchUsers" />
        <button @click="searchUsers" class="btn-search">搜索</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="card-header">
            <img :src="user.avatar_url" class="avatar" />
            <div class="user-info">
              <span class="username">{{ user.username }}</span>
              <span class="user-id">ID: {{ user.id }}</span>
            </div>
            <span :class="['badge', user.is_active ? 'active' : 'inactive']">
              {{ user.is_active ? '正常' : '封禁' }}
            </span>
          </div>

          <div class="card-content">
            <div class="info-row">
              <span class="label">邮箱：</span>
              <span class="value">{{ user.email || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">角色：</span>
              <span class="value">{{ user.role }}</span>
            </div>
            <div class="info-row">
              <span class="label">注册时间：</span>
              <span class="value">{{ formatDate(user.created_at) }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewUser(user)" class="btn-text">查看详情</button>
            </div>
            <div class="footer-right">
              <button
                v-if="user.is_active"
                @click="banUser(user)"
                class="btn-danger"
                title="封禁用户"
              >
                🚫 封禁
              </button>
              <button
                v-else
                @click="unbanUser(user)"
                class="btn-success"
                title="解封用户"
              >
                ✅ 解封
              </button>
            </div>
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
import { getUsers, updateUserStatus } from '@/api/admin';
import { format } from 'date-fns';

const users = ref([]);
const search = ref('');
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchUsers = async (reset = false) => {
  if (reset) {
    page.value = 1;
    users.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getUsers({ page: page.value, pageSize, search: search.value });
    users.value.push(...res.data.list);
    hasMore.value = users.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const searchUsers = () => fetchUsers(true);
const loadMore = () => fetchUsers();

const formatDate = (d) => d ? format(new Date(d), 'yyyy-MM-dd HH:mm') : '';

const viewUser = (user) => {
  alert(`查看用户 ${user.username} 的详情`);
};

const banUser = async (user) => {
  if (confirm(`确定封禁用户 ${user.username} 吗？`)) {
    await updateUserStatus(user.id, { is_active: false, ban_reason: '管理员操作' });
    user.is_active = false;
  }
};

const unbanUser = async (user) => {
  if (confirm(`确定解封用户 ${user.username} 吗？`)) {
    await updateUserStatus(user.id, { is_active: true });
    user.is_active = true;
  }
};

onMounted(() => fetchUsers(true));
</script>

<style scoped>
.admin-users {
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

.search-box {
  display: flex;
  gap: 8px;
  max-width: 400px;
}
.search-box input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
}
.btn-search {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-search:hover {
  background-color: #0056b3;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.user-info {
  flex: 1;
}
.username {
  font-weight: 600;
  font-size: 18px;
  display: block;
  color: #212529;
}
.user-id {
  font-size: 12px;
  color: #6c757d;
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

.btn-danger,
.btn-success {
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-danger {
  background-color: #dc3545;
  color: white;
}
.btn-danger:hover {
  background-color: #c82333;
}
.btn-success {
  background-color: #28a745;
  color: white;
}
.btn-success:hover {
  background-color: #218838;
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










































































































































































