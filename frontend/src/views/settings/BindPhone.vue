<template>
  <div class="bind-phone-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>绑定手机号</h2>
    </header>

    <div class="content">
      <div class="current-info" v-if="userInfo.phone">
        当前绑定：{{ userInfo.phone }}
      </div>

      <form @submit.prevent="bindPhone">
        <div class="form-group">
          <label>手机号</label>
          <input
            type="tel"
            v-model="form.phone"
            placeholder="请输入手机号"
            pattern="[0-9]{11}"
            required
          />
        </div>

        <div class="form-group">
          <label>验证码</label>
          <div class="captcha-group">
            <input
              type="text"
              v-model="form.captcha"
              placeholder="请输入验证码"
              required
            />
            <button
              type="button"
              class="send-captcha"
              @click="sendCaptcha"
              :disabled="captchaSending || captchaCountdown > 0"
            >
              {{ captchaCountdown > 0 ? `${captchaCountdown}秒后重发` : '发送验证码' }}
            </button>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '提交中...' : '确认绑定' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { sendSmsCaptcha, bindPhone as bindPhoneApi } from '@/api/settings';

const router = useRouter();
const userStore = useUserStore();
const userInfo = userStore.user?.value || {};

const form = reactive({
  phone: '',
  captcha: '',
});
const submitting = ref(false);
const captchaSending = ref(false);
const captchaCountdown = ref(0);
let countdownTimer = null;

const sendCaptcha = async () => {
  if (!form.phone || !/^\d{11}$/.test(form.phone)) {
    alert('请输入正确的11位手机号');
    return;
  }
  captchaSending.value = true;
  try {
    await sendSmsCaptcha(form.phone);
    captchaCountdown.value = 60;
    countdownTimer = setInterval(() => {
      if (captchaCountdown.value > 0) {
        captchaCountdown.value--;
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);
  } catch (err) {
    console.error('发送验证码失败', err);
    alert('发送失败，请稍后重试');
  } finally {
    captchaSending.value = false;
  }
};

const bindPhone = async () => {
  if (!form.phone || !form.captcha) return;
  submitting.value = true;
  try {
    await bindPhoneApi(form);
    alert('绑定成功');
    // 更新本地用户信息
    userStore.setUserInfo({ ...userInfo, phone: form.phone });
    goBack();
  } catch (err) {
    console.error('绑定失败', err);
    alert('绑定失败：' + (err.response?.data?.error || '未知错误'));
  } finally {
    submitting.value = false;
  }
};

const goBack = () => router.back();
</script>

<style scoped>
.bind-phone-container {
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
.current-info {
  background-color: #e7f3ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #004085;
}
.form-group {
  margin-bottom: 16px;
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
.captcha-group {
  display: flex;
  gap: 8px;
}
.captcha-group input {
  flex: 1;
}
.send-captcha {
  white-space: nowrap;
  padding: 10px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.send-captcha:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
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