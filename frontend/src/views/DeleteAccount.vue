<template>
  <div class="delete-account-container">
    <header class="delete-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>注销账号</h2>
    </header>

    <div class="content">
      <!-- 步骤1：身份验证 -->
      <div v-if="step === 1" class="step">
        <h3>步骤1：身份验证</h3>
        <div class="form-group">
          <label>请输入密码</label>
          <input type="password" v-model="password" placeholder="当前密码" />
        </div>
        <button @click="verifyPassword" class="next-btn" :disabled="!password">下一步</button>
      </div>

      <!-- 步骤2：风险提示 -->
      <div v-if="step === 2" class="step warning">
        <h3>⚠️ 危险操作</h3>
        <div class="warning-box">
          <p>此操作不可逆！</p>
          <p>将删除：个人资料、发帖记录、评论记录、私信记录</p>
        </div>
        <button @click="step = 3" class="next-btn">我已了解，继续</button>
        <button @click="goBack" class="cancel-btn">取消</button>
      </div>

      <!-- 步骤3：最终确认 -->
      <div v-if="step === 3" class="step">
        <h3>最终确认</h3>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="confirmChecked" /> 我已知晓所有后果
          </label>
        </div>
        <div class="form-group">
          <label>请输入“确认注销”四个汉字</label>
          <input type="text" v-model="confirmText" placeholder="确认注销" />
        </div>
        <div class="countdown">
          倒计时 <span class="countdown-number">{{ countdown }}</span> 秒
        </div>
        <button @click="handleDeleteAccount" class="delete-btn" :disabled="!canDelete">
          确认注销
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { deleteAccount } from '@/api/settings'; // 导入的 API 函数
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const step = ref(1);
const password = ref('');
const confirmChecked = ref(false);
const confirmText = ref('');
const countdown = ref(30);
let timer = null;

const canDelete = computed(() => {
  return confirmChecked.value && confirmText.value === '确认注销' && countdown.value === 0;
});

const verifyPassword = async () => {
  // 实际可调用接口验证密码，这里简化直接进入下一步
  step.value = 2;
};

const startCountdown = () => {
  countdown.value = 30;
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
};

// 本地处理函数，改名为 handleDeleteAccount
const handleDeleteAccount = async () => {
  if (!canDelete.value) return;
  try {
    await deleteAccount({ password: password.value }); // 调用导入的 API
    userStore.logout();
    router.push('/auth');
    alert('账号已注销');
  } catch (err) {
    console.error('注销失败', err);
    alert('注销失败：' + (err.response?.data?.error || '未知错误'));
  }
};

const goBack = () => router.back();

onMounted(() => {
  startCountdown();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* 样式保持不变 */
.delete-account-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.delete-header {
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
.step {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
}
.step h3 {
  margin-top: 0;
  margin-bottom: 20px;
}
.warning .warning-box {
  background-color: #f8d7da;
  color: #721c24;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
}
.form-group input[type="password"],
.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  box-sizing: border-box;
}
.next-btn, .delete-btn {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 8px;
}
.delete-btn {
  background-color: #dc3545;
}
.cancel-btn {
  width: 100%;
  padding: 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.countdown {
  text-align: center;
  margin: 16px 0;
  font-size: 18px;
}
.countdown-number {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}
</style>