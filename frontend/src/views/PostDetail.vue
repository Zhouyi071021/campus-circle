<template>
  <div class="post-detail-container">
    <header class="detail-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>帖子详情</h2>
      <button v-if="isAuthor" @click="showMenu = true" class="menu-btn">⋯</button>
    </header>

    <div class="content" ref="contentRef">
      <!-- 帖子内容 -->
      <div class="post-card">
        <!-- 作者信息：匿名帖子不显示作者信息，直接显示“匿名用户” -->
        <div class="post-header">
          <div v-if="post.is_anonymous" class="author-info anonymous">
            <img src="/default-avatar.png" class="avatar" />
            <div class="user-details">
              <span class="username">匿名用户</span>
              <span class="school">{{ post.school?.name }}</span>
            </div>
          </div>
          <div v-else class="author-info" @click="goToUserProfile(post.user?.id)">
            <img :src="post.user?.avatar_url || '/default-avatar.png'" class="avatar" />
            <div class="user-details">
              <span class="username">{{ post.user?.username }}</span>
              <span class="school">{{ post.school?.name }}</span>
            </div>
          </div>
          <span class="time">{{ formatTime(post.created_at) }}</span>
        </div>

        <!-- 关注按钮（仅当不是匿名、不是作者且已登录时显示） -->
        <div v-if="!post.is_anonymous && userStore.isLoggedIn && !isAuthor" class="follow-area">
          <button
            @click.stop="toggleFollowAuthor"
            class="follow-btn"
            :class="{ following: isFollowingAuthor }"
          >
            {{ isFollowingAuthor ? '已关注' : '关注作者' }}
          </button>
        </div>

        <h3 class="post-title">{{ post.title }}</h3>
        <div class="post-content">{{ post.content }}</div>

        <!-- 图片区域 -->
        <div v-if="post.images && post.images.length" class="post-images">
          <img
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="img"
            @click="previewImage(img)"
            class="post-image"
          />
        </div>

        <!-- 统计信息 -->
        <div class="post-stats">
          <span>❤️ {{ post.likes_count }}</span>
          <span>💬 {{ post.comments_count }}</span>
          <span>⭐ {{ post.collections_count }}</span>
          <span>👁️ {{ post.views_count }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="post-actions">
          <button @click="handleLikePost" :class="{ liked: userLiked }">
            {{ userLiked ? '❤️ 已赞' : '🤍 点赞' }}
          </button>
          <button @click="handleCollectPost" :class="{ collected: userCollected }">
            {{ userCollected ? '⭐ 已收藏' : '☆ 收藏' }}
          </button>
          <button @click="sharePost">↗️ 分享</button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="comments-section">
        <h3>评论 ({{ totalComments }})</h3>
        <div v-if="commentsLoading" class="loading">加载评论中...</div>
        <div v-else-if="comments.length === 0" class="empty">暂无评论，快来抢沙发～</div>
        <div v-else>
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
            :class="{ 'reply-comment': comment.parent_id }"
          >
            <!-- 评论者头像和用户名可点击 -->
            <div class="comment-author" @click="goToUserProfile(comment.user?.id)">
              <img :src="comment.user?.avatar_url" class="comment-avatar" />
              <span class="comment-username">{{ comment.user?.username }}</span>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span v-if="comment.reply_to" class="reply-to">回复 @{{ comment.reply_to.username }}</span>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <button @click.stop="likeComment(comment)" :class="{ liked: comment.userLiked }">
                  {{ comment.likes_count }} 👍
                </button>
                <button @click.stop="replyTo(comment)">回复</button>
                <button v-if="comment.user_id === currentUserId" @click.stop="deleteComment(comment)">删除</button>
              </div>
            </div>
          </div>
          <div v-if="hasMoreComments" class="load-more" @click="loadMoreComments">加载更多评论</div>
        </div>
      </div>

      <!-- 评论输入框 -->
      <div class="comment-input-area">
        <img :src="currentUserAvatar" class="current-avatar" />
        <div class="input-wrapper">
          <input
            v-model="newComment"
            type="text"
            :placeholder="replyToComment ? `回复 @${replyToComment.user?.username}` : '写评论...'"
            @keyup.enter="submitComment"
          />
          <button @click="submitComment" :disabled="!newComment.trim()">发送</button>
        </div>
        <button v-if="replyToComment" class="cancel-reply" @click="cancelReply">×</button>
      </div>
    </div>

    <!-- 操作菜单弹窗（删除帖子等） -->
    <div v-if="showMenu" class="modal" @click.self="showMenu = false">
      <div class="modal-content menu">
        <button @click="handleDeletePost" class="danger">删除帖子</button>
        <button @click="showMenu = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  getPost,
  likePost as apiLikePost,
  collectPost as apiCollectPost,
  deletePost as apiDeletePost
} from '@/api/post';
import {
  getComments,
  createComment,
  likeComment as apiLikeComment,
  deleteComment as apiDeleteComment
} from '@/api/comment';
import { followUser, unfollowUser, checkFollowStatus } from '@/api/user';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const currentUserId = computed(() => userStore.userInfo?.id);
const currentUserAvatar = computed(() => userStore.userInfo?.avatar_url || '/default-avatar.png');

const postId = parseInt(route.params.id);
const post = ref({});
const userLiked = ref(false);
const userCollected = ref(false);
const isAuthor = computed(() => post.value.user_id === currentUserId.value);
const isFollowingAuthor = ref(false);

// 评论相关
const comments = ref([]);
const commentsPage = ref(1);
const pageSize = 20;
const hasMoreComments = ref(true);
const totalComments = ref(0);
const commentsLoading = ref(false);
const newComment = ref('');
const replyToComment = ref(null);

// 菜单
const showMenu = ref(false);

// 加载帖子详情
const fetchPost = async () => {
  try {
    const res = await getPost(postId);
    post.value = res.data.data;
    userLiked.value = post.value.user_liked || false;
    userCollected.value = post.value.user_collected || false;
    // 如果当前用户已登录、帖子不是匿名、且不是作者，检查是否关注了作者
    if (!post.value.is_anonymous && userStore.isLoggedIn && !isAuthor.value && post.value.user?.id) {
      const followRes = await checkFollowStatus(post.value.user.id);
      isFollowingAuthor.value = followRes.data.isFollowing;
    }
  } catch (err) {
    console.error('获取帖子失败', err);
    alert('帖子不存在或已被删除');
    goBack();
  }
};

// 关注/取消关注作者
const toggleFollowAuthor = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  const authorId = post.value.user?.id;
  if (!authorId) return;
  try {
    if (isFollowingAuthor.value) {
      await unfollowUser(authorId);
      isFollowingAuthor.value = false;
    } else {
      await followUser(authorId);
      isFollowingAuthor.value = true;
    }
  } catch (err) {
    console.error('关注操作失败', err);
    alert('操作失败，请重试');
  }
};

// 加载评论
const fetchComments = async (reset = false) => {
  if (reset) {
    commentsPage.value = 1;
    comments.value = [];
    hasMoreComments.value = true;
  }
  if (commentsLoading.value || !hasMoreComments.value) return;
  commentsLoading.value = true;
  try {
    const res = await getComments(postId, commentsPage.value, pageSize);
    const list = res.data.list.map(c => ({
      ...c,
      userLiked: false
    }));
    comments.value.push(...list);
    totalComments.value = res.data.total;
    hasMoreComments.value = comments.value.length < totalComments.value;
    commentsPage.value++;
  } catch (err) {
    console.error('获取评论失败', err);
  } finally {
    commentsLoading.value = false;
  }
};

const loadMoreComments = () => fetchComments();

// 点赞帖子
const handleLikePost = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  try {
    const res = await apiLikePost(postId);
    userLiked.value = res.data.liked;
    post.value.likes_count += userLiked.value ? 1 : -1;
  } catch (err) {
    console.error('点赞失败', err);
  }
};

// 收藏帖子
const handleCollectPost = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  try {
    const res = await apiCollectPost(postId);
    userCollected.value = res.data.collected;
    post.value.collections_count += userCollected.value ? 1 : -1;
  } catch (err) {
    console.error('收藏失败', err);
  }
};

// 分享帖子
const sharePost = () => {
  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      text: post.value.content,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('链接已复制');
  }
};

// 删除帖子
const handleDeletePost = async () => {
  if (!confirm('确定删除该帖子吗？')) return;
  try {
    await apiDeletePost(postId);
    alert('删除成功');
    router.push('/');
  } catch (err) {
    console.error('删除失败', err);
  }
};

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) return;
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  try {
    const data = {
      postId: postId,
      content: newComment.value,
      parentId: replyToComment.value?.id,
    };
    const res = await createComment(data);
    const newCmt = res.data.data;
    comments.value.unshift(newCmt);
    totalComments.value++;
    post.value.comments_count++;
    newComment.value = '';
    cancelReply();
    nextTick(() => {
      document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  } catch (err) {
    console.error('评论失败', err);
  }
};

// 回复评论
const replyTo = (comment) => {
  replyToComment.value = comment;
  nextTick(() => {
    document.querySelector('.comment-input-area input')?.focus();
  });
};

// 取消回复
const cancelReply = () => {
  replyToComment.value = null;
};

// 点赞评论
const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  try {
    const res = await apiLikeComment(comment.id);
    comment.userLiked = res.data.liked;
    comment.likes_count += comment.userLiked ? 1 : -1;
  } catch (err) {
    console.error('点赞评论失败', err);
  }
};

// 删除评论
const deleteComment = async (comment) => {
  if (!confirm('确定删除该评论吗？')) return;
  try {
    await apiDeleteComment(comment.id);
    comments.value = comments.value.filter(c => c.id !== comment.id);
    totalComments.value--;
    post.value.comments_count--;
  } catch (err) {
    console.error('删除评论失败', err);
  }
};

// 图片预览
const previewImage = (url) => {
  window.open(url, '_blank');
};

const formatTime = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';

const goBack = () => router.back();

// 跳转到用户主页
const goToUserProfile = (userId) => {
  if (userId) router.push(`/profile/${userId}`);
};

onMounted(() => {
  fetchPost();
  fetchComments(true);
});
</script>

<style scoped>
/* 原有样式保持不变，添加新样式 */
.post-detail-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 80px;
}
.post-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.author-info.anonymous {
  cursor: default;
}
.author-info:hover .username {
  color: #007bff;
}
.author-info.anonymous:hover .username {
  color: inherit;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.user-details {
  display: flex;
  flex-direction: column;
}
.username {
  font-weight: 600;
  color: #212529;
}
.school {
  font-size: 12px;
  color: #6c757d;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
.follow-area {
  margin-bottom: 12px;
  text-align: right;
}
.follow-btn {
  padding: 4px 12px;
  border: 1px solid #007bff;
  border-radius: 20px;
  background-color: white;
  color: #007bff;
  font-size: 12px;
  cursor: pointer;
}
.follow-btn.following {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.post-title {
  font-size: 20px;
  margin-bottom: 12px;
}
.post-content {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
  white-space: pre-wrap;
}
.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.post-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
}
.post-stats {
  display: flex;
  gap: 16px;
  color: #6c757d;
  margin-bottom: 16px;
}
.post-actions {
  display: flex;
  gap: 8px;
}
.post-actions button {
  flex: 1;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
}
.post-actions button.liked {
  background-color: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}
.post-actions button.collected {
  background-color: #ffc107;
  color: #212529;
  border-color: #ffc107;
}
.comments-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
}
.comments-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}
.comment-item {
  display: flex;
  margin-bottom: 16px;
}
.reply-comment {
  margin-left: 40px;
}
.comment-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
  cursor: pointer;
}
.comment-author:hover .comment-username {
  color: #007bff;
}
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.comment-username {
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}
.comment-content {
  flex: 1;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.reply-to {
  font-size: 12px;
  color: #007bff;
}
.comment-time {
  font-size: 12px;
  color: #6c757d;
}
.comment-text {
  font-size: 14px;
  margin-bottom: 8px;
}
.comment-actions {
  display: flex;
  gap: 12px;
}
.comment-actions button {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
}
.comment-actions button.liked {
  color: #ff6b6b;
}
.load-more {
  text-align: center;
  padding: 12px;
  color: #007bff;
  cursor: pointer;
}
.comment-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: white;
  border-top: 1px solid #dee2e6;
  gap: 8px;
}
.current-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f1f3f5;
  border-radius: 20px;
  padding: 4px 8px 4px 12px;
}
.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  outline: none;
}
.input-wrapper button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
}
.input-wrapper button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.cancel-reply {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
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
.loading, .empty {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>