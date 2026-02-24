<template>
  <div class="community-detail-container">
    <header class="detail-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>社区详情</h2>
      <button v-if="isCreator" @click="showMenu = true" class="menu-btn">⋯</button>
    </header>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="community" class="content">
      <!-- 社区封面 -->
      <div class="cover">
        <img :src="community.cover_url" alt="社区封面" />
      </div>

      <!-- 社区信息 -->
      <div class="info">
        <h3>{{ community.name }}</h3>
        <p class="category">分类：{{ community.category || '未分类' }}</p>
        <p class="description">{{ community.description || '暂无介绍' }}</p>
        <div class="meta">
          <span>👥 成员 {{ community.member_count }}</span>
          <span>📝 帖子 {{ community.post_count }}</span>
          <span>📅 创建于 {{ formatDate(community.created_at) }}</span>
        </div>
        <p class="creator">创建者：{{ community.creator?.username }}</p>

        <!-- 加入/退出按钮 -->
        <div class="action">
          <button
            v-if="!isCreator"
            @click="toggleJoin"
            class="join-btn"
            :class="{ joined: isMember }"
            :disabled="joining"
          >
            {{ isMember ? '已加入' : '加入社区' }}
          </button>
        </div>
      </div>

      <!-- 社区规则（如果有） -->
      <div v-if="community.rules" class="rules">
        <h4>社区规则</h4>
        <p>{{ community.rules }}</p>
      </div>

      <!-- 成员列表 -->
      <div class="members-section">
        <h4>成员 ({{ memberTotal }})</h4>
        <div v-if="membersLoading" class="loading">加载成员...</div>
        <div v-else class="member-list">
          <div v-for="member in members" :key="member.id" class="member-item" @click="goToUser(member.id)">
            <img :src="member.avatar_url" class="member-avatar" />
            <span>{{ member.username }}</span>
          </div>
          <div v-if="hasMoreMembers" class="load-more" @click="loadMoreMembers">加载更多</div>
        </div>
      </div>

      <!-- 帖子列表 -->
      <div class="posts-section">
        <div class="section-header">
          <h4>社区帖子 ({{ postTotal }})</h4>
          <button v-if="isMember" @click="goToCreatePost" class="create-post-btn">+ 发帖</button>
        </div>
        <div v-if="postsLoading" class="loading">加载帖子...</div>
        <div v-else-if="posts.length === 0" class="empty">暂无帖子，快来发布第一篇吧～</div>
        <div v-else>
          <div v-for="post in posts" :key="post.id" class="post-card" @click="goToPostDetail(post.id)">
            <div class="post-header">
              <img :src="post.user?.avatar_url" class="post-avatar" />
              <div class="post-user">
                <span class="post-username">{{ post.user?.username }}</span>
                <span class="post-time">{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
            <h5 class="post-title">{{ post.title }}</h5>
            <p class="post-content">{{ truncate(post.content, 60) }}</p>
            <div class="post-stats">
              <span>❤️ {{ post.likes_count }}</span>
              <span>💬 {{ post.comments_count }}</span>
            </div>
          </div>
          <div v-if="hasMorePosts" class="load-more" @click="loadMorePosts">加载更多</div>
        </div>
      </div>
    </div>

    <!-- 操作菜单弹窗 -->
    <div v-if="showMenu" class="modal" @click.self="showMenu = false">
      <div class="modal-content menu">
        <button @click="deleteCommunity" class="danger">删除社区</button>
        <button @click="showMenu = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getCommunityPosts,
  deleteCommunity as deleteCommunityApi
} from '@/api/community';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const currentUserId = computed(() => userStore.userInfo?.id);

const communityId = parseInt(route.params.id);
const community = ref(null);
const loading = ref(false);
const error = ref('');
const isMember = ref(false);
const joining = ref(false);
const showMenu = ref(false);

// 成员列表
const members = ref([]);
const membersPage = ref(1);
const pageSize = 20;
const hasMoreMembers = ref(true);
const membersLoading = ref(false);
const memberTotal = ref(0);

// 帖子列表
const posts = ref([]);
const postsPage = ref(1);
const hasMorePosts = ref(true);
const postsLoading = ref(false);
const postTotal = ref(0);

const isCreator = computed(() => community.value?.creator_id === currentUserId.value);

const fetchCommunity = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getCommunity(communityId);
    community.value = res.data.data;
    // 如果后端返回了 is_member 字段，可以设置
    // isMember.value = res.data.data.is_member;
  } catch (err) {
    console.error('获取社区失败', err);
    error.value = err.response?.data?.error || '社区不存在或网络错误';
  } finally {
    loading.value = false;
  }
};

const fetchMembers = async (reset = false) => {
  if (reset) {
    membersPage.value = 1;
    members.value = [];
    hasMoreMembers.value = true;
  }
  if (membersLoading.value || !hasMoreMembers.value) return;
  membersLoading.value = true;
  try {
    const res = await getCommunityMembers(communityId, membersPage.value, pageSize);
    members.value.push(...res.data.list);
    memberTotal.value = res.data.total;
    hasMoreMembers.value = members.value.length < memberTotal.value;
    membersPage.value++;
  } catch (err) {
    console.error('获取成员失败', err);
  } finally {
    membersLoading.value = false;
  }
};

const loadMoreMembers = () => fetchMembers();

const fetchPosts = async (reset = false) => {
  if (reset) {
    postsPage.value = 1;
    posts.value = [];
    hasMorePosts.value = true;
  }
  if (postsLoading.value || !hasMorePosts.value) return;
  postsLoading.value = true;
  try {
    const res = await getCommunityPosts(communityId, postsPage.value, pageSize);
    posts.value.push(...res.data.list);
    postTotal.value = res.data.total;
    hasMorePosts.value = posts.value.length < postTotal.value;
    postsPage.value++;
  } catch (err) {
    console.error('获取帖子失败', err);
  } finally {
    postsLoading.value = false;
  }
};

const loadMorePosts = () => fetchPosts();

const toggleJoin = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  joining.value = true;
  try {
    if (isMember.value) {
      await leaveCommunity(communityId);
      isMember.value = false;
      community.value.member_count--;
    } else {
      await joinCommunity(communityId);
      isMember.value = true;
      community.value.member_count++;
    }
  } catch (err) {
    console.error('操作失败', err);
    alert(err.response?.data?.error || '操作失败');
  } finally {
    joining.value = false;
  }
};

const deleteCommunity = async () => {
  if (!confirm('确定删除该社区吗？')) return;
  try {
    await deleteCommunityApi(communityId);  // 使用别名调用
    router.push('/communities');
  } catch (err) {
    console.error('删除失败', err);
    alert(err.response?.data?.error || '删除失败');
  }
};

const goToCreatePost = () => {
  router.push({ path: '/post/create', query: { communityId } });
};

const goToPostDetail = (postId) => {
  router.push(`/post/${postId}`);
};

const goToUser = (userId) => {
  router.push(`/profile/${userId}`);
};

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
};

const truncate = (text, len) => {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
};

const goBack = () => router.back();

onMounted(() => {
  fetchCommunity();
  fetchMembers(true);
  fetchPosts(true);
});
</script>

<style scoped>
.community-detail-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.menu-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.content {
  padding: 16px;
}
.cover {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
}
.category {
  color: #007bff;
  font-size: 14px;
  margin-bottom: 8px;
}
.description {
  color: #495057;
  margin-bottom: 12px;
  line-height: 1.5;
}
.meta {
  display: flex;
  gap: 16px;
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 8px;
}
.creator {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 16px;
}
.action {
  text-align: center;
}
.join-btn {
  padding: 10px 20px;
  border: 1px solid #007bff;
  border-radius: 30px;
  background-color: white;
  color: #007bff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.join-btn.joined {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rules {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.rules h4 {
  margin: 0 0 8px 0;
}
.members-section,
.posts-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-header h4 {
  margin: 0;
}
.create-post-btn {
  padding: 4px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
  cursor: pointer;
}
.member-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 4px;
}
.member-item span {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
}
.post-card {
  border-bottom: 1px solid #f1f3f5;
  padding: 12px 0;
  cursor: pointer;
}
.post-card:last-child {
  border-bottom: none;
}
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.post-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
}
.post-user {
  flex: 1;
}
.post-username {
  font-weight: 600;
  font-size: 14px;
  display: block;
}
.post-time {
  font-size: 12px;
  color: #6c757d;
}
.post-title {
  font-size: 16px;
  margin: 0 0 4px 0;
}
.post-content {
  font-size: 14px;
  color: #495057;
  margin-bottom: 6px;
}
.post-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6c757d;
}
.load-more {
  text-align: center;
  padding: 8px;
  color: #007bff;
  cursor: pointer;
}
.loading {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
.error {
  text-align: center;
  padding: 40px;
  color: #dc3545;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content.menu {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  width: 200px;
}
.modal-content.menu button {
  display: block;
  width: 100%;
  padding: 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}
.modal-content.menu button.danger {
  color: #dc3545;
}
</style>