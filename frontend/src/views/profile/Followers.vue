<template>
  <div class="followers-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>粉丝列表</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="users.length === 0" class="empty">暂无粉丝</div>
      <div v-else>
        <div v-for="user in users" :key="user.id" class="user-item" @click="goToProfile(user.id)">
          <img :src="user.avatar_url" class="avatar" />
          <div class="info">
            <span class="username">{{ user.username }}</span>
            <span class="bio">{{ user.bio || '暂无简介' }}</span>
          </div>
          <button
            v-if="user.isFollowing"
            @click.stop="unfollow(user)"
            class="follow-btn following"
          >
            已关注
          </button>
          <button
            v-else
            @click.stop="follow(user)"
            class="follow-btn"
          >
            关注
          </button>
        </div>
      </div>
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFollowers, followUser, unfollowUser } from '@/api/user';

const route = useRoute();
const router = useRouter();
const userId = route.query.userId || '';

const users = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchFollowers = async (reset = false) => {
  if (reset) {
    page.value = 1;
    users.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getFollowers(userId, page.value, pageSize);
    users.value.push(...res.data.list);
    hasMore.value = users.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取粉丝列表失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchFollowers();

const follow = async (user) => {
  try {
    await followUser(user.id);
    user.isFollowing = true;
  } catch (err) {
    console.error('关注失败', err);
  }
};

const unfollow = async (user) => {
  try {
    await unfollowUser(user.id);
    user.isFollowing = false;
  } catch (err) {
    console.error('取消关注失败', err);
  }
};

const goToProfile = (id) => {
  router.push(`/profile/${id}`);
};

const goBack = () => router.back();

onMounted(() => {
  fetchFollowers(true);
});
</script>

<style scoped>
.followers-container {
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
  padding: 16px;
}
.user-item {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.username {
  font-weight: 600;
}
.bio {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}
.follow-btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  border-radius: 20px;
  background-color: white;
  color: #007bff;
  cursor: pointer;
}
.follow-btn.following {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>









































































































































































