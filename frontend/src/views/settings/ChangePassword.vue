<template>
  <div class="change-password-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>修改密码</h2>
    </header>

    <div class="content">
      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label>原密码</label>
          <input
            type="password"
            v-model="form.oldPassword"
            placeholder="请输入原密码"
            required
          />
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input
            type="password"
            v-model="form.newPassword"
            placeholder="8-20位字符"
            minlength="8"
            maxlength="20"
            required
          />
        </div>

        <div class="form-group">
          <label>确认新密码</label>
          <input
            type="password"
            v-model="form.confirmPassword"
            placeholder="再次输入新密码"
            minlength="8"
            maxlength="20"
            required
          />
          <span v-if="passwordMismatch" class="error-text">两次密码不一致</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="!canSubmit || submitting">
          {{ submitting ? '提交中...' : '确认修改' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { changePassword as changePasswordApi } from '@/api/settings'; // 重命名导入

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const submitting = ref(false);

const passwordMismatch = computed(() => {
  return form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword;
});

const canSubmit = computed(() => {
  return form.oldPassword && form.newPassword && form.confirmPassword && !passwordMismatch.value;
});

const changePassword = async () => {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    await changePasswordApi({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    alert('密码修改成功，请重新登录');
    userStore.logout(); // 使用已定义的 userStore 实例
    router.push('/auth');
  } catch (err) {
    console.error('修改密码失败', err);
    alert('修改失败：' + (err.response?.data?.error || '原密码错误'));
  } finally {
    submitting.value = false;
  }
};

const goBack = () => router.back();
</script>

<style scoped>
.change-password-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 16px;
}
.content {
  padding: 20px;
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
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.error-text {
  color: #dc3545;
  font-size: 14px;
  margin-top: 4px;
  display: block;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
}
.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>