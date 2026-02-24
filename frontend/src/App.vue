<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from './stores/user';
import { useMessageStore } from './stores/message';
import { getUnreadCounts } from './api/message';

const userStore = useUserStore();
const messageStore = useMessageStore();
let pollInterval = null;

const pollUnread = async () => {
  if (!userStore.isLoggedIn || !localStorage.getItem('token')) return;
  try {
    const res = await getUnreadCounts();
    messageStore.setTotalUnread(res.data.totalUnread || 0);
  } catch (err) {
    console.error('轮询未读数失败', err);
    // 如果是 401，可以尝试清除 token 并跳转登录？但谨慎
  }
};

onMounted(() => {
  if (userStore.isLoggedIn) {
    pollUnread();
    pollInterval = setInterval(pollUnread, 30000);
  }
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style>
/* 无需额外样式 */
</style>