<template>
  <div class="my-posts-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>我的帖子</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty">暂无发布的帖子</div>
      <div v-else>
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="goToPost(post.id)"
        >
          <div class="post-header">
            <span class="school-badge">{{ post.school?.name || '未知学校' }}</span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
          <h4 class="post-title">{{ post.title }}</h4>
          <p class="post-excerpt">{{ truncate(post.content, 60) }}</p>
          <div class="post-stats">
            <span>❤️ {{ post.likes_count }}</span>
            <span>💬 {{ post.comments_count }}</span>
            <span>⭐ {{ post.collections_count }}</span>
            <span>👁️ {{ post.views_count }}</span>
          </div>
        </div>
        <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getUserPosts } from '@/api/user';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 优先使用路由中的 userId（查看他人），否则使用当前用户ID
const userId = computed(() => route.query.userId || userStore.userInfo?.id);

const posts = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchPosts = async (reset = false) => {
  if (!userId.value) return;
  if (reset) {
    page.value = 1;
    posts.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getUserPosts(userId.value, page.value, pageSize);
    posts.value.push(...res.data.list);
    hasMore.value = posts.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取帖子列表失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchPosts();
const formatTime = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';
const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;
const goToPost = (id) => router.push(`/post/${id}`);
const goBack = () => router.back();

onMounted(() => fetchPosts(true));
</script>

<style scoped>
.my-posts-container {
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
  justify-content: space-between;
  margin-bottom: 8px;
}
.school-badge {
  background-color: #e7f3ff;
  color: #007bff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
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
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>