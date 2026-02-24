<template>
  <div class="list-view-container">
    <header class="list-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>帖子列表</h2>
      <button @click="showCalendar = true" class="calendar-btn">📅</button>
    </header>

    <!-- 当前选中日期显示 -->
    <div v-if="selectedDate" class="date-info">
      {{ formatDate(selectedDate) }}的帖子（共 {{ total }} 条）
    </div>

    <!-- 帖子列表 -->
    <div class="post-list" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || !hasMore">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @click="goToPostDetail(post.id)"
      />
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!hasMore && posts.length > 0" class="no-more">没有更多了</div>
      <div v-if="posts.length === 0 && !loading" class="empty">暂无帖子</div>
    </div>

    <!-- 日历弹窗 -->
    <div v-if="showCalendar" class="calendar-modal" @click.self="showCalendar = false">
      <div class="calendar-wrapper">
        <CalendarPicker v-model="selectedDate" @select="onDateSelect" />
        <button class="close-btn" @click="showCalendar = false">关闭</button>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getPostsByDate } from '@/api/post';
import PostCard from '@/components/post/PostCard.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import CalendarPicker from '@/components/CalendarPicker.vue';
import { vInfiniteScroll } from '@vueuse/components';

const router = useRouter();
const route = useRoute();

const posts = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const total = ref(0);
const selectedDate = ref(route.query.date || ''); // 从 URL 参数获取，如 /list?date=2025-02-06
const showCalendar = ref(false);

const fetchPosts = async (reset = false) => {
  if (!selectedDate.value) return;
  if (reset) {
    page.value = 1;
    posts.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getPostsByDate(selectedDate.value, page.value, pageSize);
    const { list, total: totalCount } = res.data;
    if (reset) {
      posts.value = list;
    } else {
      posts.value.push(...list);
    }
    total.value = totalCount;
    hasMore.value = posts.value.length < totalCount;
    page.value++;
  } catch (err) {
    console.error('获取帖子失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchPosts();
  }
};

const onDateSelect = (date) => {
  selectedDate.value = date;
  showCalendar.value = false;
  // 更新 URL 参数，方便分享
  router.replace({ query: { date } });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
};

const goBack = () => router.back();
const goToPostDetail = (id) => router.push(`/post/${id}`);

watch(selectedDate, () => {
  if (selectedDate.value) {
    fetchPosts(true);
  }
}, { immediate: true });
</script>

<style scoped>
.list-view-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.calendar-btn {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}
.date-info {
  padding: 12px 16px;
  background-color: #e9ecef;
  font-size: 14px;
  color: #495057;
}
.post-list {
  padding: 12px;
}
.calendar-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.calendar-wrapper {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  width: 90%;
  max-width: 400px;
}
.close-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.loading, .no-more, .empty {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>