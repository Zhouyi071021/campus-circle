<template>
  <div class="tag-detail-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>#{{ tag }}</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty">暂无相关帖子</div>
      <div v-else>
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="goToPost(post.id)"
        />
        <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPostsByTag } from '@/api/post';
import PostCard from '@/components/post/PostCard.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const tag = ref(route.params.tag);

const posts = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchPosts = async (reset = false) => {
  if (reset) {
    page.value = 1;
    posts.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getPostsByTag(tag.value, page.value, pageSize);
    posts.value.push(...res.data.list);
    hasMore.value = posts.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取标签帖子失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchPosts();
const goToPost = (id) => router.push(`/post/${id}`);
const goBack = () => router.back();

onMounted(() => fetchPosts(true));
</script>

<style scoped>
.tag-detail-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
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
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
</style>