<template>
  <form @submit.prevent="handleLogin" class="login-form">
    <div class="form-group">
      <input
        type="text"
        v-model="form.username"
        placeholder="用户名"
        required
      />
    </div>
    <div class="form-group password-group">
      <input
        :type="showPassword ? 'text' : 'password'"
        v-model="form.password"
        placeholder="密码"
        required
      />
      <span class="toggle-password" @click="showPassword = !showPassword">
        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
      </span>
    </div>
    <div class="form-options">
      <label>
        <input type="checkbox" v-model="rememberMe" /> 记住我
      </label>
    </div>
    <button type="submit" class="btn-login" :disabled="loading">
      {{ loading ? '登录中...' : '登录' }}
    </button>
    <div v-if="error" class="error-message">{{ error }}</div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../../api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);

const form = reactive({
  username: '',
  password: '',
});

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '用户名和密码不能为空';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await login(form);
    const { token, user } = res.data.data;

    // 存储 token 和用户信息到 store
    userStore.setToken(token, rememberMe.value);
    userStore.setUserInfo(user, rememberMe.value);

    // 跳转到首页
    router.push('/');
  } catch (err) {
    console.error('登录失败:', err);
    error.value = err.response?.data?.error || '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  position: relative;
}
.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}
.form-group input:focus {
  border-color: #007bff;
}
.password-group {
  display: flex;
  align-items: center;
}
.password-group input {
  flex: 1;
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  color: #6c757d;
  font-size: 20px;
}
.form-options {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
}
.btn-login {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-login:hover {
  background-color: #0056b3;
}
.btn-login:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.error-message {
  color: #dc3545;
  font-size: 14px;
  text-align: center;
}
</style>