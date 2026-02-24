<template>
  <div class="school-detail-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>{{ school.name }}</h2>
    </header>

    <div class="content">
      <div class="school-info">
        <img :src="school.logo_url" class="school-logo" />
        <p>学校ID：{{ school.id }}</p>
      </div>

      <div class="tab-bar">
        <span :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">帖子</span>
        <span :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">成员</span>
      </div>

      <div v-if="activeTab === 'posts'" class="posts-list">
        <div v-if="loadingPosts" class="loading">加载中...</div>
        <div v-else-if="posts.length === 0" class="empty">暂无帖子</div>
        <div v-else>
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @click="goToPost(post.id)"
          />
          <div v-if="hasMorePosts" class="load-more" @click="loadMorePosts">加载更多</div>
        </div>
      </div>

      <div v-else-if="activeTab === 'members'" class="members-list">
        <div v-if="loadingMembers" class="loading">加载中...</div>
        <div v-else-if="members.length === 0" class="empty">暂无成员</div>
        <div v-else>
          <div v-for="user in members" :key="user.id" class="member-item" @click="goToUser(user.id)">
            <img :src="user.avatar_url" class="avatar" />
            <span class="username">{{ user.username }}</span>
          </div>
          <div v-if="hasMoreMembers" class="load-more" @click="loadMoreMembers">加载更多</div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSchool, getSchoolPosts, getSchoolMembers } from '@/api/school';
import PostCard from '@/components/post/PostCard.vue';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const schoolId = parseInt(route.params.id);

const school = ref({});
const activeTab = ref('posts');

// 帖子列表
const posts = ref([]);
const postsPage = ref(1);
const pageSize = 20;
const hasMorePosts = ref(true);
const loadingPosts = ref(false);

// 成员列表（假设有 school_members 表或根据用户 school_id 统计，简单实现）
const members = ref([]);
const membersPage = ref(1);
const hasMoreMembers = ref(true);
const loadingMembers = ref(false);

const fetchSchool = async () => {
  try {
    const res = await getSchool(schoolId);
    school.value = res.data.data;
  } catch (err) {
    console.error('获取学校信息失败', err);
    alert('学校不存在');
    goBack();
  }
};

const fetchPosts = async (reset = false) => {
  if (reset) {
    postsPage.value = 1;
    posts.value = [];
    hasMorePosts.value = true;
  }
  if (loadingPosts.value || !hasMorePosts.value) return;
  loadingPosts.value = true;
  try {
    const res = await getSchoolPosts(schoolId, postsPage.value, pageSize);
    posts.value.push(...res.data.list);
    hasMorePosts.value = posts.value.length < res.data.total;
    postsPage.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loadingPosts.value = false;
  }
};

const loadMorePosts = () => fetchPosts();

const fetchMembers = async (reset = false) => {
  if (reset) {
    membersPage.value = 1;
    members.value = [];
    hasMoreMembers.value = true;
  }
  if (loadingMembers.value || !hasMoreMembers.value) return;
  loadingMembers.value = true;
  try {
    // 假设接口为 /api/schools/:id/members
    const res = await getSchoolMembers(schoolId, membersPage.value, pageSize);
    members.value.push(...res.data.list);
    hasMoreMembers.value = members.value.length < res.data.total;
    membersPage.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loadingMembers.value = false;
  }
};

const loadMoreMembers = () => fetchMembers();

const goToPost = (id) => router.push(`/post/${id}`);
const goToUser = (id) => router.push(`/profile/${id}`);
const goBack = () => router.back();

onMounted(() => {
  fetchSchool();
  fetchPosts(true);
  // 如果切换到成员标签再加载
});
</script>

<style scoped>
.school-detail-container {
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
  padding: 16px;
}
.school-info {
  text-align: center;
  margin-bottom: 20px;
}
.school-logo {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.tab-bar {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 16px;
}
.tab-bar span {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
  color: #6c757d;
}
.tab-bar span.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}
.posts-list, .members-list {
  min-height: 200px;
}
.member-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}
.username {
  font-weight: 500;
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