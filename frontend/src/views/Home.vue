<template>
  <div>
    <h1>校园圈首页</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const message = ref('');

onMounted(async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/`);
    message.value = res.data;
  } catch (err) {
    message.value = '后端连接失败';
    console.error(err);
  }
});
</script>