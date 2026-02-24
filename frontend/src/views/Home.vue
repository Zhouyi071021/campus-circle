<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <nav class="top-nav">
      <div class="nav-left">
        <span class="mailbox-icon" @click="goToSuggestions">📬</span>
        <NavMusic />
      </div>
      <div class="nav-center">
        <select v-model="schoolFilter" @change="onFilterChange">
          <option value="all">所有学校</option>
          <option value="school">只看本校</option>
          <option value="district">同区学校</option>
          <option value="city">同市学校</option>
          <option value="custom">自定义选择</option>
        </select>
        <SchoolPicker
          v-if="showSchoolPicker"
          v-model="customSchools"
          @update:modelValue="onCustomSchoolsChange"
        />
      </div>
      <div class="nav-right">
        <!-- 公告图标 -->
        <span class="announcement-icon" @click="showAnnouncement = true">📢</span>
        <span class="search-icon" @click="goToSearch">🔍</span>
        <span class="service-icon" @click="goToBusiness">🏪</span>
        <span class="ranking-icon" @click="showRankingModal = true">🏆</span>
        <span class="sponsor-icon" @click="goToSponsor">❤️</span>
        <span class="calendar-icon" @click="goToListView">📅</span>
      </div>
    </nav>

    <!-- 帖子列表（已移除无限滚动，改为按钮加载） -->
    <div class="post-list">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="handleLike"
        @collect="handleCollect"
        @click="goToPostDetail(post.id)"
        @tag-click="goToTag"
        @avatar-click="goToUser"
      />
      <div v-if="loading" class="loading-indicator">加载中...</div>
      <div v-if="!hasMore && posts.length > 0" class="no-more">没有更多了</div>
      <div v-if="hasMore" class="load-more-btn" @click="loadMore">加载更多</div>
      <div v-if="posts.length === 0 && !loading" class="empty-state">
        暂无帖子，快来发布第一条吧～
      </div>
    </div>

    <!-- 排行榜弹窗 -->
    <div v-if="showRankingModal" class="ranking-modal" @click.self="showRankingModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>排行榜</h3>
          <button @click="showRankingModal = false" class="close-btn">✕</button>
        </div>
        <RankingWidget />
      </div>
    </div>

    <!-- 公告弹窗 -->
    <AnnouncementModal v-if="showAnnouncement" @close="showAnnouncement = false" />

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getPosts, likePost, collectPost } from '@/api/post';
import PostCard from '@/components/post/PostCard.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import RankingWidget from '@/components/ranking/RankingWidget.vue';
import SchoolPicker from '@/components/SchoolPicker.vue';
import NavMusic from '@/components/NavMusic.vue';
import AnnouncementModal from '@/components/AnnouncementModal.vue'; // 新增导入

const router = useRouter();
const userStore = useUserStore();

// 筛选条件
const schoolFilter = ref('all');
const showSchoolPicker = ref(false);
const customSchools = ref([]);

// 帖子数据
const posts = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);
const loadingMore = ref(false);

// 排行榜弹窗
const showRankingModal = ref(false);

// 公告弹窗
const showAnnouncement = ref(false);

// 加载帖子列表
const fetchPosts = async (reset = false, extraParams = {}) => {
  if (reset) {
    page.value = 1;
    posts.value = [];
    hasMore.value = true;
  }
  if (!hasMore.value || loading.value) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize,
      schoolFilter: schoolFilter.value,
      ...extraParams,
    };
    const res = await getPosts(params);
    const { list, total } = res.data;
    if (reset) {
      posts.value = list;
    } else {
      posts.value.push(...list);
    }
    hasMore.value = posts.value.length < total;
    page.value++;
  } catch (err) {
    console.error('获取帖子失败', err);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchPosts();
  }
};

// 筛选变化处理
const onFilterChange = () => {
  if (schoolFilter.value === 'custom') {
    showSchoolPicker.value = true;
  } else {
    fetchPosts(true);
  }
};

const onCustomSchoolsChange = (schools) => {
  customSchools.value = schools;
  showSchoolPicker.value = false;
  fetchPosts(true, { customSchoolIds: schools.map(s => s.id) });
};

// 点赞处理
const handleLike = async (post) => {
  try {
    const res = await likePost(post.id);
    if (res.data.success) {
      const liked = res.data.liked;
      const targetPost = posts.value.find(p => p.id === post.id);
      if (targetPost) {
        if (liked) {
          targetPost.likes_count = (targetPost.likes_count || 0) + 1;
        } else {
          targetPost.likes_count = Math.max((targetPost.likes_count || 0) - 1, 0);
        }
        targetPost.liked = liked;
      }
    }
  } catch (err) {
    console.error('点赞失败', err);
    alert('点赞操作失败，请稍后重试');
  }
};

// 收藏处理
const handleCollect = async (post) => {
  try {
    const res = await collectPost(post.id);
    if (res.data.success) {
      const collected = res.data.collected;
      const targetPost = posts.value.find(p => p.id === post.id);
      if (targetPost) {
        if (collected) {
          targetPost.collections_count = (targetPost.collections_count || 0) + 1;
        } else {
          targetPost.collections_count = Math.max((targetPost.collections_count || 0) - 1, 0);
        }
        targetPost.collected = collected;
      }
    }
  } catch (err) {
    console.error('收藏失败', err);
    alert('收藏操作失败，请稍后重试');
  }
};

// 跳转帖子详情
const goToPostDetail = (postId) => {
  router.push(`/post/${postId}`);
};

// 跳转到用户主页
const goToUser = (userId) => {
  if (userId) {
    router.push(`/profile/${userId}`);
  }
};

const goToSuggestions = () => router.push('/suggestions');
const goToSearch = () => router.push('/search');
const goToBusiness = () => router.push('/business');
const goToSponsor = () => router.push('/sponsor');
const goToListView = () => router.push('/list');
const goToTag = (tag) => {
  router.push(`/tag/${encodeURIComponent(tag)}`);
};

// 初始化
onMounted(() => {
  fetchPosts(true);
});

// 监听筛选变化（排除 custom 情况，避免重复请求）
watch(schoolFilter, (newVal) => {
  if (newVal !== 'custom') {
    fetchPosts(true);
  }
});
</script>

<style scoped>
.home-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-left span {
  font-size: 24px;
  cursor: pointer;
}
.nav-center {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-center select {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #ced4da;
  background-color: white;
  font-size: 14px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-right span {
  font-size: 20px;
  cursor: pointer;
}
.post-list {
  padding: 12px;
}
.loading-indicator,
.no-more,
.empty-state {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
.load-more-btn {
  text-align: center;
  padding: 2px;
  background-color: #007bff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
}
.ranking-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
}
.modal-header h3 {
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}
</style>