<template>
  <div class="post-card" @click="$emit('click')">
    <!-- 卡片头部：作者信息 + 时间（点击头像跳转，匿名不可点击） -->
    <div class="post-header">
      <div v-if="post.is_anonymous" class="author-info anonymous">
        <img src="/default-avatar.png" class="avatar" />
        <div class="author-details">
          <span class="username">匿名用户</span>
          <span class="school-badge">{{ post.school?.name || '未知学校' }}</span>
        </div>
      </div>
      <div v-else class="author-info" @click.stop="$emit('avatar-click', post.user?.id)">
        <img :src="post.user?.avatar_url || '/default-avatar.png'" class="avatar" />
        <div class="author-details">
          <span class="username">{{ post.user?.username || '未知用户' }}</span>
          <span class="school-badge">{{ post.school?.name || '未知学校' }}</span>
        </div>
      </div>
      <span class="time">{{ formatTime(post.created_at) }}</span>
    </div>

    <!-- 帖子标题 -->
    <h3 class="post-title">{{ post.title }}</h3>

    <!-- 帖子内容摘要（超过50字符自动截断） -->
    <p class="post-excerpt">{{ truncateContent(post.content) }}</p>

    <!-- 图片展示区域（仅当有图片时显示） -->
    <div v-if="post.images && post.images.length" class="post-images">
      <div
        v-for="(img, index) in post.images.slice(0, 9)"
        :key="index"
        class="image-item"
        :style="{ backgroundImage: 'url(' + img + ')' }"
        @click.stop
      >
        <div v-if="index === 8 && post.images.length > 9" class="image-overlay">
          +{{ post.images.length - 8 }}
        </div>
      </div>
    </div>

    <!-- 标签区域 -->
    <div v-if="post.tags && post.tags.length" class="post-tags">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="tag"
        @click.stop="$emit('tag-click', tag)"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- 底部统计和操作（点赞、收藏） -->
    <div class="post-footer">
      <div class="post-meta">
        <span class="meta-item" @click.stop="$emit('like', post)">
          ❤️ {{ post.likes_count || 0 }}
        </span>
        <span class="meta-item" @click.stop="$emit('collect', post)">
          ⭐ {{ post.collections_count || 0 }}
        </span>
        <span class="meta-item">💬 {{ post.comments_count || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click', 'like', 'collect', 'tag-click', 'avatar-click']);

// 截断内容，超过50字符显示省略号（可根据需要修改 length）
const truncateContent = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhCN });
};
</script>

<style scoped>
/* 原有样式保持不变，添加匿名样式 */
.post-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 头部区域 */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.author-info.anonymous {
  cursor: default;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.author-details {
  display: flex;
  flex-direction: column;
}
.username {
  font-weight: 600;
  font-size: 15px;
  color: #212529;
}
.school-badge {
  background-color: #e7f3ff;
  color: #007bff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  display: inline-block;
  width: fit-content;
  margin-top: 2px;
}
.time {
  font-size: 12px;
  color: #6c757d;
}

/* 帖子标题 */
.post-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #212529;
  line-height: 1.4;
}

/* 内容摘要 */
.post-excerpt {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
  line-height: 1.5;
}

/* 图片网格 - 限制最大宽度，使图片更紧凑 */
.post-images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin: 12px 0;
  max-width: 280px; /* 限制网格整体宽度，图片自然缩小 */
}
.image-item {
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  border-radius: 8px;
  position: relative;
}
.post-images:only-child .image-item:only-child {
  aspect-ratio: 16 / 9;
}
.image-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
}

/* 标签区域 */
.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}
.tag {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.tag:hover {
  background-color: #dee2e6;
}

/* 底部区域 */
.post-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.post-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6c757d;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.meta-item:hover {
  color: #007bff;
}
</style>