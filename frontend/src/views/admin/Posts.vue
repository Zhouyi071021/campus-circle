<template>
  <div class="admin-posts">
    <h2>帖子管理</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="post in posts" :key="post.id" class="post-card">
          <div class="card-header">
            <div class="user-info">
              <img :src="post.user?.avatar_url" class="avatar" />
              <div>
                <span class="username">{{ post.user?.username }}</span>
                <span class="post-time">{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
            <span class="post-id">ID: {{ post.id }}</span>
          </div>

          <div class="card-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ truncate(post.content, 150) }}</p>
            <div class="post-meta">
              <span>❤️ {{ post.likes_count || 0 }}</span>
              <span>💬 {{ post.comments_count || 0 }}</span>
              <span>⭐ {{ post.collections_count || 0 }}</span>
              <span>👁️ {{ post.views_count || 0 }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewPost(post)" class="btn-text">查看全文</button>
            </div>
            <div class="footer-right">
              <button @click="handleDelete(post)" class="btn-delete" title="删除">🗑️ 删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getManagePosts, deletePost } from '@/api/admin';
import { format } from 'date-fns';

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
    const res = await getManagePosts(page.value, pageSize);
    posts.value.push(...res.data.list);
    hasMore.value = posts.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchPosts();

const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm');

const viewPost = (post) => {
  window.open(`/post/${post.id}`, '_blank');
};

const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;

const handleDelete = async (post) => {
  const reason = prompt('请输入删除原因（可选）');
  if (reason === null) return;
  try {
    await deletePost(post.id, reason);
    posts.value = posts.value.filter(p => p.id !== post.id);
  } catch (err) {
    console.error('删除失败', err);
    alert('删除失败');
  }
};

onMounted(() => fetchPosts(true));
</script>

<style scoped>
.admin-posts {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  font-size: 16px;
  color: #212529;
  display: block;
}

.post-time {
  font-size: 12px;
  color: #6c757d;
}

.post-id {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
}

.post-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 500;
}

.post-excerpt {
  font-size: 14px;
  line-height: 1.6;
  color: #495057;
  margin-bottom: 8px;
  word-break: break-word;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.btn-text:hover {
  text-decoration: underline;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-delete:hover {
  background-color: #c82333;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}
.load-more:hover {
  text-decoration: underline;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>