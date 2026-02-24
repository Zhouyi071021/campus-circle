<template>
  <div class="collections-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>{{ isOwn ? '我的收藏' : 'TA的收藏' }}</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="collections.length === 0" class="empty">暂无收藏的帖子</div>
      <div v-else>
        <div
          v-for="post in collections"
          :key="post.id"
          class="post-card"
          @click="goToPost(post.id)"
        >
          <div class="post-header">
            <img :src="post.user?.avatar_url" class="avatar" />
            <div class="user-info">
              <span class="username">{{ post.user?.username }}</span>
              <span class="school">{{ post.school?.name }}</span>
            </div>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
          <h4 class="post-title">{{ post.title }}</h4>
          <p class="post-excerpt">{{ truncate(post.content, 60) }}</p>
          <div class="post-stats">
            <span>❤️ {{ post.likes_count }}</span>
            <span>💬 {{ post.comments_count }}</span>
            <span>⭐ {{ post.collections_count }}</span>
          </div>
        </div>
        <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getMyCollections, getUserCollections } from '@/api/user';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 从查询参数获取目标用户ID
const targetUserId = route.query.userId;
// 判断是否为当前登录用户自己的收藏
const isOwn = computed(() => !targetUserId || targetUserId === userStore.user?.id);

const collections = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchCollections = async (reset = false) => {
  if (reset) {
    page.value = 1;
    collections.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    let res;
    if (isOwn.value) {
      // 查看自己的收藏
      res = await getMyCollections(page.value, pageSize);
    } else {
      // 查看他人的收藏
      res = await getUserCollections(targetUserId, page.value, pageSize);
    }
    collections.value.push(...res.data.list);
    hasMore.value = collections.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取收藏列表失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchCollections();

const formatTime = (ts) => (ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '');
const truncate = (text, len) => (text?.length > len ? text.slice(0, len) + '...' : text);

const goToPost = (id) => router.push(`/post/${id}`);
const goBack = () => router.back();

onMounted(() => fetchCollections(true));
</script>

<style scoped>
/* 样式保持不变（可复用之前提供的样式） */
.collections-container {
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
  padding: 12px;
}
.post-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}
.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.username {
  font-weight: 600;
  font-size: 14px;
}
.school {
  font-size: 12px;
  color: #6c757d;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
.post-title {
  font-size: 16px;
  margin-bottom: 6px;
}
.post-excerpt {
  font-size: 14px;
  color: #495057;
  margin-bottom: 8px;
}
.post-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c757d;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>