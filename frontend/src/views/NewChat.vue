<template>
  <div class="new-chat-container">
    <div class="loading">正在创建聊天，请稍候...</div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sendMessage } from '@/api/message';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const receiverId = route.query.receiverId;
  const receiverName = route.query.receiverName;
  const otherAvatar = route.query.otherAvatar;

  if (!receiverId) {
    console.error('缺少 receiverId');
    router.push('/messages');
    return;
  }

  try {
    // 发送一条默认消息，后端会自动创建会话并返回消息对象（包含 conversation_id）
    const res = await sendMessage({
      receiverId,
      content: '你好，我开始和你聊天了！', // 默认消息，可自定义
      type: 'text',
    });

    const conversationId = res.data.data.conversation_id;
    // 跳转到聊天页面，并携带对方信息
    router.replace({
      path: `/messages/${conversationId}`,
      query: {
        otherId: receiverId,
        otherName: receiverName,
        otherAvatar: otherAvatar,
      },
    });
  } catch (err) {
    console.error('创建聊天失败', err);
    alert('无法创建聊天，请稍后重试');
    router.push('/messages');
  }
});
</script>

<style scoped>
.new-chat-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
  color: #6c757d;
}
</style>