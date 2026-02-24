<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h2>校园圈管理</h2></div>
      <ul class="nav-menu">
        <li><router-link to="/admin" exact>仪表盘</router-link></li>

        <template v-if="isAdmin">
          <li><router-link to="/admin/posts">帖子审核</router-link></li>
          <li><router-link to="/admin/comments">评论审核</router-link></li>
          <li><router-link to="/admin/users">用户管理</router-link></li>
          <li><router-link to="/admin/communities">社区管理</router-link></li>
          <li><router-link to="/admin/districts">地区管理</router-link></li>
          <li><router-link to="/admin/music">背景音乐</router-link></li>
          <li><router-link to="/admin/business">商家审核</router-link></li>
        </template>

        <template v-if="isSuperAdmin">
          <li><router-link to="/admin/applications">商家申请</router-link></li>
          <li><router-link to="/admin/suggestions">建议管理</router-link></li>
          <li><router-link to="/admin/agreements">协议管理</router-link></li>
          <li><router-link to="/admin/logs">操作日志</router-link></li>
          <li><router-link to="/admin/admins">管理员管理</router-link></li>
        </template>
      </ul>
    </aside>

    <main class="content">
      <div class="content-header">
        <button @click="goToProfile" class="back-btn">← 返回个人中心</button>
      </div>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const router = useRouter();

const { user } = storeToRefs(userStore);
const role = computed(() => user.value?.role);

const isAdmin = computed(() => ['admin', 'super_admin'].includes(role.value));
const isSuperAdmin = computed(() => role.value === 'super_admin');

// 返回个人中心
const goToProfile = () => {
  router.push('/profile');
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.sidebar {
  width: 220px;
  background-color: #343a40;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #4b545c;
}
.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.nav-menu {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}
.nav-menu li {
  margin: 4px 0;
}
.nav-menu a {
  display: block;
  padding: 10px 16px;
  color: #adb5bd;
  text-decoration: none;
  transition: all 0.2s;
}
.nav-menu a:hover {
  background-color: #3f474e;
  color: #fff;
}
.nav-menu a.router-link-active,
.nav-menu a.router-link-exact-active {
  background-color: #007bff;
  color: #fff;
}
.content {
  flex: 1;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}
.content-header {
  padding: 12px 24px;
  background-color: #fff;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}
.back-btn:hover {
  background-color: #e9ecef;
}
.content-body {
  padding: 24px;
  flex: 1;
}
</style>