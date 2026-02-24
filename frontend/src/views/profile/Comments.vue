<template>
  <div class="my-comments-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>我的评论</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="comments.length === 0" class="empty">暂无评论</div>
      <div v-else>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-card"
          @click="goToPost(comment.post_id)"
        >
          <div class="comment-header">
            <span class="post-title">评论了：{{ comment.post?.title }}</span>
            <span class="time">{{ formatTime(comment.created_at) }}</span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-footer">
            <span>👍 {{ comment.likes_count }}</span>
            <button @click.stop="handleDeleteComment(comment)" v-if="comment.user_id === currentUserId">删除</button>
          </div>
        </div>
        <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getUserComments, deleteComment as deleteCommentApi } from '@/api/user'; // 使用别名避免冲突
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const router = useRouter();
const userStore = useUserStore();
const currentUserId = userStore.userInfo?.id;

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
    const res = await getUserComments(page.value, pageSize);
    comments.value.push(...res.data.list);
    hasMore.value = comments.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取评论列表失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchComments();

const formatTime = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';

// 将本地函数重命名为 handleDeleteComment，避免与导入的 deleteComment 冲突
const handleDeleteComment = async (comment) => {
  if (!confirm('确定删除该评论吗？')) return;
  try {
    await deleteCommentApi(comment.id); // 调用带别名的 API 函数
    comments.value = comments.value.filter(c => c.id !== comment.id);
  } catch (err) {
    console.error('删除失败', err);
    alert('删除失败');
  }
};

const goToPost = (postId) => {
  router.push(`/post/${postId}`);
};

const goBack = () => router.back();

onMounted(() => fetchComments(true));
</script>

<style scoped>
/* 样式保持不变 */
.my-comments-container {
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
.comment-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.post-title {
  font-weight: 600;
  font-size: 15px;
  color: #007bff;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
.comment-content {
  font-size: 14px;
  color: #212529;
  margin-bottom: 8px;
}
.comment-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6c757d;
}
.comment-footer button {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
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