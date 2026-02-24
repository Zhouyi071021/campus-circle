<template>
  <div class="communities-container">
    <header class="communities-header">
      <h2>社区</h2>
      <div class="header-actions">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索社区"
          @keyup.enter="handleSearch"
        />
        <button @click="goToCreate">创建</button>
      </div>
    </header>

    <!-- 分类导航 -->
    <div class="category-tabs">
      <span
        v-for="cat in categories"
        :key="cat"
        :class="['tab', { active: currentCategory === cat }]"
        @click="changeCategory(cat)"
      >
        {{ cat }}
      </span>
    </div>

    <!-- 社区列表 -->
    <div class="community-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="communities.length === 0" class="empty">
        暂无社区，快去创建一个吧～
      </div>
      <div
        v-for="comm in communities"
        :key="comm.id"
        class="community-card"
        @click="goToDetail(comm.id)"
      >
        <img :src="comm.cover_url" alt="cover" class="cover" />
        <div class="info">
          <h4>{{ comm.name }}</h4>
          <p class="desc">{{ comm.description }}</p>
          <div class="stats">
            <span>成员 {{ comm.member_count }}</span>
            <span>帖子 {{ comm.post_count }}</span>
            <span>今日 {{ comm.today_active }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCommunities } from '@/api/community';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const communities = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const searchKeyword = ref('');
const currentCategory = ref(''); // '' 表示全部
const categories = ['全部', '游戏', '动漫', '学习', '运动', '音乐']; // 示例分类

const fetchCommunities = async (reset = false) => {
  if (reset) {
    page.value = 1;
    communities.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize,
      category: currentCategory.value === '全部' ? '' : currentCategory.value,
      search: searchKeyword.value,
    };
    const res = await getCommunities(params);
    const { list, total } = res.data;
    communities.value.push(...list);
    hasMore.value = communities.value.length < total;
    page.value++;
  } catch (err) {
    console.error('获取社区失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchCommunities();

const handleSearch = () => fetchCommunities(true);

const changeCategory = (cat) => {
  currentCategory.value = cat === '全部' ? '' : cat;
  fetchCommunities(true);
};

const goToCreate = () => router.push('/communities/create');
const goToDetail = (id) => router.push(`/communities/${id}`);

onMounted(() => {
  fetchCommunities(true);
});
</script>

<style scoped>
.communities-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.communities-header {
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.communities-header h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.header-actions input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  font-size: 14px;
}
.header-actions button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
.category-tabs {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  gap: 12px;
}
.tab {
  white-space: nowrap;
  padding: 4px 12px;
  border-radius: 16px;
  background-color: #f1f3f5;
  color: #495057;
  cursor: pointer;
}
.tab.active {
  background-color: #007bff;
  color: white;
}
.community-list {
  padding: 12px;
}
.community-card {
  display: flex;
  background-color: white;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}
.cover {
  width: 100px;
  height: 100px;
  object-fit: cover;
}
.info {
  flex: 1;
  padding: 12px;
}
.info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}
.desc {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
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