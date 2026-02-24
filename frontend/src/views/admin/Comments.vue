<template>
  <div class="admin-comments">
    <h2>评论管理</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div class="card-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-card">
          <div class="card-header">
            <div class="user-info">
              <img :src="comment.user?.avatar_url" class="avatar" />
              <div>
                <span class="username">{{ comment.user?.username }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
              </div>
            </div>
            <span class="comment-id">ID: {{ comment.id }}</span>
          </div>

          <div class="card-content">
            <div class="post-info">
              <span class="post-label">所属帖子：</span>
              <a href="#" @click.prevent="viewPost(comment.post_id)" class="post-link">
                {{ comment.post?.title || '帖子#' + comment.post_id }}
              </a>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewComment(comment)" class="btn-text">查看全文</button>
            </div>
            <div class="footer-right">
              <button @click="handleDelete(comment)" class="btn-delete" title="删除">🗑️ 删除</button>
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
import { getManageComments, deleteComment } from '@/api/admin';
import { format } from 'date-fns';

const comments = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

const fetchComments = async (reset = false) => {
  if (reset) {
    page.value = 1;
    comments.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getManageComments(page.value, pageSize);
    comments.value.push(...res.data.list);
    hasMore.value = comments.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchComments();

const formatDate = (d) => d ? format(new Date(d), 'yyyy-MM-dd HH:mm') : '';

const viewComment = (comment) => {
  alert(`评论内容：${comment.content}\n\n完整内容可查看帖子。`);
};

const viewPost = (postId) => {
  window.open(`/post/${postId}`, '_blank');
};

const handleDelete = async (comment) => {
  const reason = prompt('请输入删除原因（可选）');
  if (reason === null) return;
  try {
    await deleteComment(comment.id, reason);
    comments.value = comments.value.filter(c => c.id !== comment.id);
  } catch (err) {
    console.error('删除失败', err);
    alert('删除失败');
  }
};

onMounted(() => fetchComments(true));
</script>

<style scoped>
.admin-comments {
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

.comment-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.comment-card:hover {
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

.comment-time {
  font-size: 12px;
  color: #6c757d;
}

.comment-id {
  font-size: 12px;
  color: #6c757d;
}

.card-content {
  margin-bottom: 16px;
}

.post-info {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 8px;
  background-color: #f8f9fa;
  padding: 6px 10px;
  border-radius: 6px;
}

.post-label {
  font-weight: 500;
}

.post-link {
  color: #007bff;
  text-decoration: none;
  margin-left: 4px;
}
.post-link:hover {
  text-decoration: underline;
}

.comment-text {
  font-size: 15px;
  line-height: 1.6;
  color: #212529;
  word-break: break-word;
  white-space: pre-wrap;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 4px;
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