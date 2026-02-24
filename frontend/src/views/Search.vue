<template>
  <div class="search-container">
    <header class="search-header">
      <button @click="goBack" class="back-btn">←</button>
      <div class="search-box">
        <input
          ref="searchInput"
          type="text"
          v-model="keyword"
          placeholder="搜索..."
          @keyup.enter="performSearch"
        />
        <button @click="performSearch">搜索</button>
      </div>
    </header>

    <!-- 热门搜索推荐 -->
    <div v-if="!keyword && hotSearches.length" class="hot-searches">
      <h3>热门搜索</h3>
      <div class="tags">
        <span v-for="hot in hotSearches" :key="hot" @click="keyword = hot; performSearch()" class="hot-tag">
          {{ hot }}
        </span>
      </div>
    </div>

    <!-- 搜索结果分类 tabs -->
    <div v-if="results" class="tabs">
      <span
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.name }} ({{ totals[tab.key] || 0 }})
      </span>
    </div>

    <!-- 高级筛选（仅帖子） -->
    <div v-if="activeTab === 'posts'" class="filters">
      <select v-model="filterSchool">
        <option value="">全部学校</option>
        <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="filterTime">
        <option value="">全部时间</option>
        <option value="today">今天</option>
        <option value="week">近7天</option>
        <option value="month">近30天</option>
      </select>
    </div>

    <!-- 搜索结果列表 -->
    <div class="results-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!currentList.length" class="empty">没有找到相关内容</div>
      <template v-else>
        <!-- 帖子卡片 -->
        <PostCard
          v-for="item in currentList"
          v-if="activeTab === 'posts'"
          :key="item.id"
          :post="item"
          @click="goToPost(item.id)"
        />
        <!-- 用户卡片 -->
        <div v-else-if="activeTab === 'users'" v-for="user in currentList" :key="user.id" class="user-card" @click="goToUser(user.id)">
          <img :src="user.avatar_url" class="avatar" />
          <div class="info">
            <span class="username">{{ user.username }}</span>
            <span class="bio">{{ user.bio }}</span>
          </div>
          <span class="followers">{{ user.followers_count }} 粉丝</span>
        </div>
        <!-- 学校卡片 -->
        <div v-else-if="activeTab === 'schools'" v-for="school in currentList" :key="school.id" class="school-card" @click="goToSchool(school.id)">
          <img :src="school.logo_url" class="logo" />
          <span class="name">{{ school.name }}</span>
        </div>
        <!-- 商家卡片 -->
        <div v-else-if="activeTab === 'businesses'" v-for="biz in currentList" :key="biz.id" class="business-card" @click="goToBusiness(biz.id)">
          <h4>{{ biz.title }}</h4>
          <p>{{ biz.description }}</p>
          <span>{{ biz.price_range }}</span>
        </div>
      </template>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && currentList.length" class="load-more" @click="loadMore">加载更多</div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { comprehensiveSearch, searchPosts, searchUsers, searchSchools, searchBusinesses } from '@/api/search';
import { getSchools } from '@/api/school';
import PostCard from '@/components/post/PostCard.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const searchInput = ref(null);
const keyword = ref('');
const hotSearches = ref(['校园活动', '二手书', '找搭子', '考试资料', '兼职']); // 示例

const activeTab = ref('posts');
const tabs = [
  { key: 'posts', name: '帖子' },
  { key: 'users', name: '用户' },
  { key: 'schools', name: '学校' },
  { key: 'businesses', name: '商家' },
];
const results = ref(null); // 存储搜索结果对象
const totals = ref({ posts: 0, users: 0, schools: 0, businesses: 0 });
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);

// 筛选条件
const filterSchool = ref('');
const filterTime = ref('');

// 学校列表（用于帖子筛选下拉）
const schools = ref([]);

// 当前显示的列表
const currentList = computed(() => {
  if (!results.value) return [];
  return results.value[activeTab.value] || [];
});

// 获取学校列表（供筛选下拉使用）
const fetchSchools = async () => {
  try {
    const res = await getSchools({ pageSize: 100 }); // 获取足够多的学校
    schools.value = res.data.data || [];
  } catch (err) {
    console.error('获取学校列表失败', err);
  }
};

// 执行综合搜索
const performSearch = async (reset = true) => {
  if (!keyword.value.trim()) {
    results.value = null;
    return;
  }
  if (reset) {
    page.value = 1;
    hasMore.value = false;
  }
  loading.value = true;
  try {
    if (reset) {
      // 综合搜索
      const res = await comprehensiveSearch(keyword.value);
      results.value = res.data.data;
      totals.value = res.data.total;
    } else {
      // 分页加载更多，按当前类型单独搜索
      let res;
      const params = { q: keyword.value, page: page.value, pageSize };
      if (activeTab.value === 'posts') {
        params.schoolId = filterSchool.value;
        params.timeRange = filterTime.value;
        res = await searchPosts(params);
      } else if (activeTab.value === 'users') {
        res = await searchUsers(params);
      } else if (activeTab.value === 'schools') {
        res = await searchSchools(params);
      } else {
        res = await searchBusinesses(params);
      }
      const newList = res.data.list;
      results.value[activeTab.value] = [...(results.value[activeTab.value] || []), ...newList];
      hasMore.value = results.value[activeTab.value].length < res.data.total;
      page.value++;
    }
  } catch (err) {
    console.error('搜索失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    performSearch(false);
  }
};

watch(activeTab, () => {
  // 切换 tab 时重置分页，但保留已有数据
  page.value = 1;
  hasMore.value = false;
});

const goBack = () => router.back();
const goToPost = (id) => router.push(`/post/${id}`);
const goToUser = (id) => router.push(`/profile/${id}`);
const goToSchool = (id) => router.push(`/school/${id}`);
const goToBusiness = (id) => router.push(`/business/${id}`);

onMounted(() => {
  nextTick(() => {
    searchInput.value?.focus();
  });
  fetchSchools(); // 加载学校列表供筛选
});
</script>

<style scoped>
/* 样式保持不变，与你的原有代码一致 */
.search-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.search-header {
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
  margin-right: 8px;
}
.search-box {
  flex: 1;
  display: flex;
  gap: 8px;
}
.search-box input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  font-size: 16px;
}
.search-box button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
.hot-searches {
  padding: 16px;
  background-color: white;
  margin: 12px;
  border-radius: 12px;
}
.hot-searches h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hot-tag {
  padding: 6px 12px;
  background-color: #e9ecef;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}
.tabs {
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
.filters {
  display: flex;
  padding: 8px 16px;
  background-color: white;
  gap: 8px;
}
.filters select {
  flex: 1;
  padding: 6px;
  border: 1px solid #ced4da;
  border-radius: 8px;
}
.results-list {
  padding: 12px;
}
.user-card, .school-card, .business-card {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}
.user-card .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}
.user-card .info {
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
}
.followers {
  color: #007bff;
}
.school-card .logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-right: 12px;
}
.business-card {
  flex-direction: column;
  align-items: flex-start;
}
.business-card h4 {
  margin: 0 0 4px 0;
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