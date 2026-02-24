<template>
  <div class="blacklist-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>黑名单管理</h2>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="blacklist.length === 0" class="empty">暂无黑名单用户</div>
      <div v-else>
        <div v-for="item in blacklist" :key="item.id" class="blacklist-item">
          <img :src="item.avatar_url" class="avatar" />
          <span class="username">{{ item.username }}</span>
          <button @click="removeFromBlacklist(item)" class="remove-btn">移除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getBlacklist, removeBlacklist } from '@/api/settings';

const router = useRouter();
const blacklist = ref([]);
const loading = ref(false);

const fetchBlacklist = async () => {
  loading.value = true;
  try {
    const res = await getBlacklist();
    blacklist.value = res.data.data;
  } catch (err) {
    console.error('获取黑名单失败', err);
  } finally {
    loading.value = false;
  }
};

const removeFromBlacklist = async (user) => {
  if (confirm(`确定将 ${user.username} 移出黑名单吗？`)) {
    try {
      await removeBlacklist(user.id);
      blacklist.value = blacklist.value.filter(u => u.id !== user.id);
    } catch (err) {
      console.error('移除失败', err);
    }
  }
};

const goBack = () => router.back();

onMounted(() => {
  fetchBlacklist();
});
</script>

<style scoped>
.blacklist-container {
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
  padding: 16px;
}
.blacklist-item {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}
.username {
  flex: 1;
  font-weight: 500;
}
.remove-btn {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>