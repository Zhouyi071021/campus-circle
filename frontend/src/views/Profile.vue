<template>
  <div class="profile-container">
    <header class="profile-header">
      <h2>个人中心</h2>
      <button v-if="isOwnProfile && !loading" @click="goToSettings" class="settings-icon">⚙️</button>
    </header>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="router.back()" class="back-btn">返回</button>
    </div>
    <div v-else-if="!targetUserId" class="loading">等待用户数据...</div>
    <div v-else class="profile-info">
      <img :src="userInfo.avatar_url || '/default-avatar.png'" class="avatar" />
      <div class="info">
        <div class="username">
          <h3>{{ userInfo.username }}</h3>
          <span class="title-badge">{{ userInfo.title || '校园新星' }}</span>
        </div>
        <p class="school">{{ userInfo.school?.name || '未设置学校' }}</p>

        <div class="contact-info" v-if="userInfo.qq || userInfo.wechat">
          <div v-if="userInfo.qq" class="contact-item">
            <span class="contact-label">QQ：</span>
            <span class="contact-value">{{ userInfo.qq }}</span>
          </div>
          <div v-if="userInfo.wechat" class="contact-item">
            <span class="contact-label">微信：</span>
            <span class="contact-value">{{ userInfo.wechat }}</span>
          </div>
        </div>

        <p v-if="userInfo.bio" class="bio">{{ userInfo.bio }}</p>
        <div class="stats">
          <div @click="goToFollowingPage" class="stat-item">
            <span class="count">{{ userInfo.following_count || 0 }}</span>
            <span class="label">关注</span>
          </div>
          <div @click="goToFollowersPage" class="stat-item">
            <span class="count">{{ userInfo.followers_count || 0 }}</span>
            <span class="label">粉丝</span>
          </div>
          <div class="stat-item">
            <span class="count">{{ userInfo.posts_count || 0 }}</span>
            <span class="label">帖子</span>
          </div>
        </div>

        <div class="action-buttons">
          <template v-if="isOwnProfile">
            <button @click="goToEditProfile" class="edit-btn">编辑资料</button>
            <button @click="confirmLogout" class="logout-btn">退出登录</button>
            <!-- 管理员入口：任何管理员角色都显示 -->
            <!-- 管理员入口：任何管理员角色都显示 -->
<button v-if="['admin', 'super_admin'].includes(userInfo.role)" @click="goToAdmin" class="admin-btn">管理后台</button>
          </template>
          <template v-else>
            <button @click="toggleFollow" class="follow-btn" :class="{ following: isFollowing }">
              {{ isFollowing ? '已关注' : '关注' }}
            </button>
            <button @click="goToChat" class="chat-btn">💬 私信</button>
            <button
              v-if="!isBlocked"
              @click="blockUser"
              class="block-btn"
            >
              🚫 拉黑
            </button>
            <button
              v-else
              class="block-btn blocked"
              disabled
            >
              🚫 已拉黑
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="profile-tabs" v-if="targetUserId">
      <div class="tab" :class="{ active: activeTab === 'posts' }" @click="goToMyPosts">
        {{ isOwnProfile ? '我的帖子' : 'TA的帖子' }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'collections' }" @click="goToCollectionsPage">
        {{ isOwnProfile ? '我的收藏' : 'TA的收藏' }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'following' }" @click="goToFollowingPage">
        {{ isOwnProfile ? '我的关注' : 'TA的关注' }}
      </div>
      <div class="tab" :class="{ active: activeTab === 'followers' }" @click="goToFollowersPage">
        {{ isOwnProfile ? '我的粉丝' : 'TA的粉丝' }}
      </div>
    </div>

    <div class="tab-content" v-if="targetUserId">
      <div v-if="activeTab === 'posts'">
        <div v-for="post in posts" :key="post.id" class="post-item">{{ post.title }}</div>
        <router-link :to="`/profile/posts?userId=${targetUserId}`">查看全部</router-link>
      </div>
      <div v-if="activeTab === 'collections'">
        <router-link :to="`/profile/collections?userId=${targetUserId}`">查看全部收藏</router-link>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getUserProfile, followUser, unfollowUser, checkFollowStatus } from '@/api/user';
import { blockUser as blockUserApi } from '@/api/settings';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const getUserIdFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch (e) {
    console.error('解析 localStorage 用户信息失败', e);
  }
  return null;
};

const currentUser = computed(() => {
  const storeUser = userStore.user?.value;
  if (storeUser) return storeUser;
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('后备解析失败', e);
  }
  return null;
});

const currentUserId = computed(() => currentUser.value?.id || getUserIdFromStorage());
const targetUserId = computed(() => route.params.id || currentUserId.value);
const isOwnProfile = computed(() => !route.params.id || route.params.id === currentUserId.value);

const userInfo = ref({});
const loading = ref(false);
const error = ref('');
const isFollowing = ref(false);
const isBlocked = ref(false);
const activeTab = ref('posts');
const posts = ref([]);

const fetchUserInfo = async () => {
  if (!targetUserId.value) {
    console.warn('targetUserId 为空，无法获取用户信息');
    return;
  }
  loading.value = true;
  error.value = '';

  try {
    if (isOwnProfile.value) {
      // 自己主页：直接从当前用户数据获取完整信息（包含 role）
      if (!currentUser.value) throw new Error('用户未登录');
      userInfo.value = { ...currentUser.value };
    } else {
      // 他人主页：调用公开 API
      const res = await getUserProfile(targetUserId.value);
      userInfo.value = res.data.data;
      // 检查关注状态
      if (currentUser.value) {
        const followRes = await checkFollowStatus(targetUserId.value);
        isFollowing.value = followRes.data.isFollowing;
      }
    }
  } catch (err) {
    console.error('获取用户信息失败', err);
    error.value = err.response?.data?.error || '用户不存在或网络错误';
  } finally {
    loading.value = false;
  }
};

watch(currentUser, (newVal) => {
  if (newVal && !route.params.id && !userInfo.value.id) {
    fetchUserInfo();
  }
}, { immediate: true });

watch(() => route.params.id, () => {
  fetchUserInfo();
});

watch(() => route.query.t, () => {
  fetchUserInfo();
});

onMounted(() => {
  if (targetUserId.value) {
    fetchUserInfo();
  } else {
    console.log('等待用户数据...');
  }
});

const toggleFollow = async () => {
  if (!currentUser.value) {
    router.push('/auth');
    return;
  }
  try {
    if (isFollowing.value) {
      await unfollowUser(targetUserId.value);
      isFollowing.value = false;
      userInfo.value.followers_count--;
    } else {
      await followUser(targetUserId.value);
      isFollowing.value = true;
      userInfo.value.followers_count++;
    }
  } catch (err) {
    console.error('操作失败', err);
    alert('操作失败，请重试');
  }
};

const goToChat = () => {
  if (!currentUser.value) {
    router.push('/auth');
    return;
  }
  router.push({
    path: `/messages/new`,
    query: {
      receiverId: targetUserId.value,
      receiverName: userInfo.value.username,
      otherAvatar: userInfo.value.avatar_url,
    },
  });
};

const goToSettings = () => router.push('/settings');
const goToEditProfile = () => router.push('/profile/edit');
const goToCollectionsPage = () => router.push(`/profile/collections?userId=${targetUserId.value}`);
const goToMyPosts = () => router.push(`/profile/posts?userId=${targetUserId.value}`);
const goToFollowingPage = () => router.push(`/profile/following?userId=${targetUserId.value}`);
const goToFollowersPage = () => router.push(`/profile/followers?userId=${targetUserId.value}`);
const goToAdmin = () => router.push('/admin');

const confirmLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout();
    router.push('/auth');
  }
};

const blockUser = async () => {
  try {
    await blockUserApi(targetUserId.value);
    isBlocked.value = true;
  } catch (err) {
    alert(err.response?.data?.error || '拉黑失败');
  }
};
</script>

<style scoped>
.loading { text-align: center; padding: 40px; color: #6c757d; }
.error { text-align: center; padding: 40px; color: #dc3545; }
.error button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.follow-btn, .chat-btn, .block-btn, .admin-btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.follow-btn {
  border: 1px solid #007bff;
  background-color: white;
  color: #007bff;
}
.follow-btn.following {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.chat-btn {
  background-color: #28a745;
  color: white;
  border: none;
}
.block-btn {
  border: 1px solid #6c757d;
  background-color: white;
  color: #6c757d;
}
.block-btn.blocked {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
  cursor: not-allowed;
}
.admin-btn {
  background-color: #6f42c1;
  color: white;
  border: none;
}
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.edit-btn, .logout-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.edit-btn {
  background-color: #007bff;
  color: white;
}
.logout-btn {
  background-color: #dc3545;
  color: white;
}
.logout-btn:hover {
  background-color: #c82333;
}
.profile-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.settings-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}
.profile-info {
  display: flex;
  padding: 20px 16px;
  background-color: white;
  margin-bottom: 8px;
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 16px;
  object-fit: cover;
}
.info {
  flex: 1;
}
.username {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.username h3 {
  margin: 0;
  font-size: 20px;
}
.title-badge {
  background-color: #ffc107;
  color: #212529;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}
.school {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 4px;
}
.contact-info {
  margin: 8px 0;
  font-size: 14px;
  color: #495057;
}
.contact-item {
  margin-bottom: 4px;
}
.contact-label {
  color: #6c757d;
  margin-right: 4px;
}
.contact-value {
  font-weight: 500;
}
.bio {
  color: #495057;
  font-size: 14px;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
.stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #495057;
  margin-bottom: 8px;
}
.stat-item {
  cursor: pointer;
  text-align: center;
}
.stat-item .count {
  font-weight: 600;
  display: block;
}
.stat-item .label {
  color: #6c757d;
  font-size: 12px;
}
.profile-tabs {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
  color: #6c757d;
}
.tab.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}
.tab-content {
  padding: 16px;
}
.post-item {
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>














































































































































































































































































































































































































































