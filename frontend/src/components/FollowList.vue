<template>
  <div class="follow-list">
    <header>
      <button @click="goBack">←</button>
      <h3>{{ type === 'followers' ? '粉丝' : '关注' }}</h3>
    </header>
    <div v-for="user in list" :key="user.id" class="user-item" @click="goToProfile(user.id)">
      <img :src="user.avatar_url" class="avatar" />
      <span class="name">{{ user.username }}</span>
      <span class="followers">{{ user.followers_count }} 粉丝</span>
      <button v-if="type === 'following'" @click.stop="unfollow(user.id)">取消关注</button>
    </div>
    <Pagination :page="page" :total="total" @change="fetchData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFollowers, getFollowing, unfollowUser } from '@/api/user';

const route = useRoute();
const router = useRouter();
const userId = route.params.id;
const type = route.params.type; // 'followers' 或 'following'
const list = ref([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);

const fetchData = async (p = page.value) => {
  const api = type === 'followers' ? getFollowers : getFollowing;
  const res = await api(userId, { page: p, pageSize });
  list.value = res.data.list;
  total.value = res.data.total;
};
const unfollow = async (targetId) => {
  await unfollowUser(targetId);
  fetchData();
};
const goBack = () => router.back();
const goToProfile = (id) => router.push(`/profile/${id}`);

onMounted(() => fetchData());
</script>