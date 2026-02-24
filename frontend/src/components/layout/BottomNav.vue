<template>
  <div class="bottom-nav">
    <div class="nav-item" :class="{ active: activeTab === 'home' }" @click="goTo('/')">
      <span class="icon">🏠</span>
      <span class="label">首页</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === 'communities' }" @click="goTo('/communities')">
      <span class="icon">👥</span>
      <span class="label">社区</span>
    </div>
    <div class="nav-item publish-btn" @click="openPublishMenu">
      <span class="icon">+</span>
    </div>
    <!-- 快速发布弹窗 -->
    <div v-if="showQuickPublish" class="quick-publish-modal" @click.self="showQuickPublish = false">
      <div class="quick-publish-content">
        <h3>快速发布</h3>
        <textarea
          v-model="quickContent"
          placeholder="说点什么..."
          rows="3"
          :disabled="quickPublishing"
        ></textarea>
        <div class="quick-actions">
          <button @click="publishQuick" :disabled="quickPublishing || !quickContent.trim()">
            {{ quickPublishing ? '发布中...' : '发布' }}
          </button>
          <button @click="goToFullPublish" :disabled="quickPublishing">详细发布</button>
        </div>
      </div>
    </div>
    <div class="nav-item" :class="{ active: activeTab === 'messages' }" @click="goTo('/messages')">
      <span class="icon">💬</span>
      <span class="label">消息</span>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </div>
    <div class="nav-item" :class="{ active: activeTab === 'profile' }" @click="goTo('/profile')">
      <span class="icon">👤</span>
      <span class="label">我的</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessageStore } from '@/stores/message';
import { useUserStore } from '@/stores/user';
import { createPost } from '@/api/post';

const route = useRoute();
const router = useRouter();
const messageStore = useMessageStore();
const userStore = useUserStore();

// 当前激活的导航项
const activeTab = computed(() => {
  const path = route.path;
  if (path === '/') return 'home';
  if (path.startsWith('/communities')) return 'communities';
  if (path.startsWith('/messages')) return 'messages';
  if (path.startsWith('/profile')) return 'profile';
  return '';
});

// 未读消息数
const unreadCount = computed(() => messageStore.totalUnread || 0);

// 快速发布弹窗控制
const showQuickPublish = ref(false);
const quickContent = ref('');
const quickPublishing = ref(false);

// 导航跳转 ✅ 正确写法
const goTo = (path) => {
  router.push(path);
};

// 打开快速发布弹窗（需检查登录）
const openPublishMenu = () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  showQuickPublish.value = true;
};

// 快速发布
const publishQuick = async () => {
  if (!quickContent.value.trim() || quickPublishing.value) return;
  quickPublishing.value = true;
  try {
    const title = quickContent.value.slice(0, 20);
    await createPost({
      title,
      content: quickContent.value,
      type: 'quick',
    });
    showQuickPublish.value = false;
    quickContent.value = '';
    window.location.reload(); // 简单刷新首页
  } catch (err) {
    console.error('快速发布失败:', err);
    alert('发布失败，请稍后重试');
  } finally {
    quickPublishing.value = false;
  }
};

// 跳转到详细发布页
const goToFullPublish = () => {
  showQuickPublish.value = false;
  router.push('/post/create');
};
</script>

<style scoped>
/* 样式保持不变 */
.quick-publish-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.quick-publish-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}
.quick-publish-content textarea {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ced4da;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  box-sizing: border-box;
}
.quick-publish-content textarea:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
.quick-actions {
  display: flex;
  gap: 8px;
}
.quick-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.quick-actions button:first-child {
  background-color: #28a745;
  color: white;
}
.quick-actions button:first-child:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.quick-actions button:last-child {
  background-color: #007bff;
  color: white;
}
.quick-actions button:last-child:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: white;
  border-top: 1px solid #dee2e6;
  padding: 8px 0;
  height: 60px;
  z-index: 20;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  color: #6c757d;
  cursor: pointer;
}
.nav-item.active {
  color: #007bff;
}
.icon {
  font-size: 24px;
  margin-bottom: 2px;
}
.label {
  font-size: 12px;
}
.publish-btn .icon {
  background-color: #007bff;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 0;
}
.badge {
  position: absolute;
  top: -2px;
  right: -6px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}
</style>