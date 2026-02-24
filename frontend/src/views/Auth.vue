<template>
  <div class="auth-container">
    <header class="auth-header">
      <h1>校园圈</h1>
      <p class="slogan">连接本地校园</p>
    </header>

    <!-- 选项卡：登录 / 注册 -->
    <div class="tab-bar">
      <span 
        :class="['tab', { active: activeTab === 'login' }]"
        @click="activeTab = 'login'"
      >登录</span>
      <span 
        :class="['tab', { active: activeTab === 'register' }]"
        @click="activeTab = 'register'"
      >注册</span>
    </div>

    <!-- 登录表单 -->
    <LoginForm v-if="activeTab === 'login'" />

    <!-- 注册表单 -->
    <RegisterForm v-else />

    <!-- 底部轮播热门帖子卡片 -->
    <div class="hot-posts-carousel">
      <!-- 这里稍后实现 -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 删除原来的 @ 导入，改成：
import LoginForm from '../components/auth/LoginForm.vue';
import RegisterForm from '../components/auth/RegisterForm.vue';

const activeTab = ref('login'); // 默认登录
</script>

<style scoped>
.auth-container {
  max-width: 480px; /* 移动端舒适宽度 */
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.auth-header {
  text-align: center;
  margin-bottom: 30px;
}
.auth-header h1 {
  font-size: 32px;
  color: #007bff;
  margin-bottom: 5px;
}
.slogan {
  color: #6c757d;
  font-size: 14px;
}
.tab-bar {
  display: flex;
  justify-content: center;
  gap: 40px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.tab {
  font-size: 18px;
  padding: 0 5px 10px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s;
}
.tab.active {
  color: #007bff;
  border-bottom: 3px solid #007bff;
  font-weight: 600;
}
</style>