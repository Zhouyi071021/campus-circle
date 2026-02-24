<template>
  <div class="messages-container">
    <header class="messages-header">
      <h2>消息</h2>
    </header>

    <!-- Tab 切换 -->
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'conversations' }" @click="switchTab('conversations')">
        私信 <span v-if="totalUnreadConversations" class="badge">{{ totalUnreadConversations }}</span>
      </div>
      <div class="tab" :class="{ active: activeTab === 'notifications' }" @click="switchTab('notifications')">
        通知 <span v-if="notificationUnreadCount" class="badge">{{ notificationUnreadCount }}</span>
      </div>
    </div>

    <!-- 搜索联系人（仅私信 tab） -->
    <div v-if="activeTab === 'conversations'" class="search-contact">
      <input v-model="searchContact" placeholder="搜索联系人" />
    </div>

    <!-- 私信列表 -->
    <div v-if="activeTab === 'conversations'" class="conversation-list">
      <div v-if="loadingConversations" class="loading">加载中...</div>
      <div v-else-if="filteredConversations.length === 0" class="empty">暂无会话，快去和好友聊天吧～</div>
      <div v-for="conv in filteredConversations" :key="conv.conversation_id" class="conversation-item" @click="goToChat(conv)">
        <img :src="conv.other_user?.avatar_url || '/default-avatar.png'" class="avatar" />
        <div class="info">
          <div class="top">
            <span class="username">{{ conv.other_user?.username }}</span>
            <span class="time">{{ formatTime(conv.last_message?.created_at) }}</span>
          </div>
          <div class="bottom">
            <span class="last-message">{{ truncate(conv.last_message?.content) }}</span>
            <span v-if="conv.unread_count > 0" class="unread-badge">{{ conv.unread_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知列表 -->
    <div v-else-if="activeTab === 'notifications'" class="notification-list">
      <div class="notification-header">
        <button v-if="notificationUnreadCount > 0" @click="markAllAsRead" class="mark-read-btn">全部标为已读</button>
      </div>
      <div v-if="loadingNotifications" class="loading">加载中...</div>
      <div v-else-if="notifications.length === 0" class="empty">暂无通知</div>
      <div v-else>
        <div v-for="item in notifications" :key="item.id" class="notification-item" :class="{ unread: !item.is_read }" @click="handleNotificationClick(item)">
          <img :src="item.sender?.avatar_url || '/default-avatar.png'" class="avatar" />
          <div class="content">
            <p class="text">{{ item.content }}</p>
            <span class="time">{{ formatTime(item.created_at) }}</span>
          </div>
          <span v-if="!item.is_read" class="unread-dot"></span>
        </div>
        <div v-if="hasMoreNotifications" class="load-more" @click="loadMoreNotifications">加载更多</div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getConversations } from '@/api/message';
import { getNotifications, getUnreadCount, markAllAsRead as apiMarkAllAsRead } from '@/api/notification';
import BottomNav from '@/components/layout/BottomNav.vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const router = useRouter();
const activeTab = ref('conversations');

// 私信
const conversations = ref([]);
const loadingConversations = ref(true);
const searchContact = ref('');
const totalUnreadConversations = ref(0);

// 通知
const notifications = ref([]);
const loadingNotifications = ref(false);
const notificationsPage = ref(1);
const notificationsPageSize = 20;
const hasMoreNotifications = ref(true);
const notificationUnreadCount = ref(0);

const filteredConversations = computed(() => {
  if (!searchContact.value) return conversations.value;
  return conversations.value.filter(c => c.other_user?.username.includes(searchContact.value));
});

const formatTime = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';
const truncate = (text, len = 20) => text?.length > len ? text.slice(0, len) + '...' : text;

const switchTab = async (tab) => {
  activeTab.value = tab;
  if (tab === 'notifications' && notifications.value.length === 0) {
    await fetchNotifications(true);
    await fetchUnreadCount();
  }
};

const fetchConversations = async () => {
  try {
    const res = await getConversations();
    conversations.value = res.data.data || [];
    totalUnreadConversations.value = conversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  } catch (err) {
    console.error('获取会话列表失败', err);
  } finally {
    loadingConversations.value = false;
  }
};

const fetchNotifications = async (reset = false) => {
  if (reset) {
    notificationsPage.value = 1;
    notifications.value = [];
    hasMoreNotifications.value = true;
  }
  if (loadingNotifications.value || !hasMoreNotifications.value) return;
  loadingNotifications.value = true;
  try {
    const res = await getNotifications(notificationsPage.value, notificationsPageSize);
    const list = res.data.list || [];
    const total = res.data.total || 0;
    notifications.value = reset ? list : [...notifications.value, ...list];
    hasMoreNotifications.value = notifications.value.length < total;
    notificationsPage.value++;
  } catch (err) {
    console.error('获取通知失败', err);
  } finally {
    loadingNotifications.value = false;
  }
};

const loadMoreNotifications = () => fetchNotifications();

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount();
    notificationUnreadCount.value = res.data.count;
  } catch (err) {
    console.error('获取未读数失败', err);
  }
};

const markAllAsRead = async () => {
  try {
    await apiMarkAllAsRead();
    notifications.value.forEach(n => (n.is_read = true));
    notificationUnreadCount.value = 0;
  } catch (err) {
    console.error('标记已读失败', err);
  }
};

const handleNotificationClick = async (item) => {
  if (!item.is_read) {
    await markAllAsRead(); // 简化处理，实际可调用单条标记
  }
  if (item.target_type === 'post') router.push(`/post/${item.target_id}`);
  else if (item.target_type === 'user') router.push(`/profile/${item.sender_id}`);
  else if (item.target_type === 'comment') router.push(`/post/${item.target_id}`);
};

const goToChat = (conv) => {
  const id = Number(conv.conversation_id);
  if (isNaN(id)) {
    console.error('无效的会话ID', conv);
    return;
  }
  router.push({
    path: `/messages/${id}`,
    query: {
      otherId: conv.other_user.id,
      otherName: conv.other_user.username,
      otherAvatar: conv.other_user.avatar_url
    }
  });
};

onMounted(() => {
  fetchConversations();
  fetchUnreadCount();
});
</script>

<style scoped>
/* 样式保持不变 */
.messages-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.messages-header {
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.messages-header h2 {
  margin: 0;
  font-size: 20px;
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
  position: relative;
  color: #6c757d;
}
.tab.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}
.badge {
  position: absolute;
  top: 6px;
  right: 30%;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-contact {
  padding: 8px 16px;
  background-color: white;
  border-bottom: 1px solid #f1f3f5;
}
.search-contact input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  font-size: 14px;
  box-sizing: border-box;
}
.conversation-list,
.notification-list {
  background-color: white;
}
.conversation-item,
.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  align-items: center;
}
.notification-item.unread {
  background-color: #f0f7ff;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.username {
  font-weight: 600;
  color: #212529;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.last-message {
  font-size: 14px;
  color: #6c757d;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-badge {
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0 4px;
}
.notification-item .content {
  flex: 1;
}
.notification-item .text {
  font-size: 14px;
  color: #212529;
  margin-bottom: 4px;
}
.notification-item .time {
  font-size: 12px;
  color: #6c757d;
}
.unread-dot {
  width: 10px;
  height: 10px;
  background-color: #007bff;
  border-radius: 50%;
  margin-left: 8px;
}
.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
}
.notification-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  background-color: #f8f9fa;
}
.mark-read-btn {
  padding: 4px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
}
</style>