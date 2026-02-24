<template>
  <div class="settings-container">
    <header class="settings-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>设置</h2>
    </header>

    <div class="settings-list">
      <!-- 账户设置 -->
      <div class="section">
        <h3>账户设置</h3>
        <div class="list-item" @click="goToBindPhone">
          <span>绑定手机号</span>
          <span class="value">{{ userInfo.phone || '未绑定' }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToBindEmail">
          <span>绑定邮箱</span>
          <span class="value">{{ userInfo.email || '未绑定' }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToChangePassword">
          <span>修改密码</span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="section">
        <h3>隐私设置</h3>
        <div class="list-item">
          <span>显示个人信息</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.show_profile" @change="updateSetting('show_profile', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="list-item">
          <span>允许陌生人私信</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.allow_stranger_message" @change="updateSetting('allow_stranger_message', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="list-item" @click="goToBlacklist">
          <span>黑名单管理</span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="section">
        <h3>通知设置</h3>
        <div class="list-item">
          <span>新消息通知</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.notify_new_message" @change="updateSetting('notify_new_message', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="list-item">
          <span>点赞评论通知</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.notify_like" @change="updateSetting('notify_like', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="list-item">
          <span>关注通知</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.notify_follow" @change="updateSetting('notify_follow', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="list-item">
          <span>系统通知</span>
          <label class="switch">
            <input type="checkbox" v-model="settings.notify_system" @change="updateSetting('notify_system', $event.target.checked)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 账号安全 -->
      <div class="section">
        <h3>账号安全</h3>
        <div class="list-item" @click="logout">
          <span>退出登录</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToLoginHistory">
          <span>登录记录</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToDeleteAccount" style="color: #dc3545;">
          <span>注销账号</span>
          <span class="arrow">›</span>
        </div>
      </div>

      <!-- 关于我们 -->
      <div class="section">
        <h3>关于我们</h3>
        <div class="list-item" @click="showVersion">
          <span>版本信息</span>
          <span class="value">1.0.0</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToAgreement('user')">
          <span>用户协议</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToAgreement('privacy')">
          <span>隐私政策</span>
          <span class="arrow">›</span>
        </div>
        <div class="list-item" @click="goToSponsor">
          <span>赞助我们</span>
          <span class="arrow">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getUserSettings, updateUserSettings } from '@/api/settings';

const router = useRouter();
const userStore = useUserStore();
const userInfo = userStore.userInfo || {};

const settings = ref({
  show_profile: true,
  allow_stranger_message: true,
  notify_new_message: true,
  notify_like: true,
  notify_comment: true,
  notify_follow: true,
  notify_system: true,
  default_scope: 'all',
  default_view_mode: 'feed',
  list_page_size: 20,
  auto_play_video: false,
  enable_music: false,
  music_volume: 50,
  music_category: 'pop'
});

// 加载设置
const loadSettings = async () => {
  try {
    const res = await getUserSettings();
    settings.value = { ...settings.value, ...res.data.data };
  } catch (err) {
    console.error('加载设置失败', err);
  }
};

// 更新设置
const updateSetting = async (key, value) => {
  try {
    await updateUserSettings({ [key]: value });
    // 本地已通过v-model更新
  } catch (err) {
    console.error('更新设置失败', err);
  }
};

const goBack = () => router.back();
const goToBindPhone = () => router.push('/settings/bind-phone');
const goToBindEmail = () => router.push('/settings/bind-email');
const goToChangePassword = () => router.push('/settings/change-password');
const goToBlacklist = () => router.push('/settings/blacklist');
const goToLoginHistory = () => router.push('/settings/login-history');
const goToDeleteAccount = () => router.push('/settings/delete-account');
const showVersion = () => alert('校园圈 v1.0.0');
const goToAgreement = (type) => {
  alert('协议内容：' + type);
};
const goToSponsor = () => router.push('/sponsor');

// 退出登录
const logout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout();
    router.push('/auth');
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
/* 样式保持不变 */
.settings-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.settings-header {
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
.settings-list {
  padding: 16px;
}
.section {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}
.section h3 {
  margin: 0;
  padding: 12px 16px;
  font-size: 16px;
  color: #6c757d;
  background-color: #f1f3f5;
  border-bottom: 1px solid #dee2e6;
}
.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
}
.list-item:last-child {
  border-bottom: none;
}
.list-item span:first-child {
  flex: 1;
  font-size: 16px;
}
.value {
  color: #6c757d;
  margin-right: 8px;
  font-size: 14px;
}
.arrow {
  color: #adb5bd;
  font-size: 18px;
}
/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #007bff;
}
input:checked + .slider:before {
  transform: translateX(26px);
}
select, input[type="range"] {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 4px;
  margin-left: 8px;
}
</style>