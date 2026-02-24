<template>
  <div class="chat-container">
    <header class="chat-header">
      <button @click="goBack" class="back-btn">←</button>
      <h3>{{ otherUser?.username || '聊天' }}</h3>
    </header>
    <div class="message-list" ref="messageList">
      <div v-for="msg in messages" :key="msg.id" :class="['message-item', msg.sender_id === currentUserId ? 'mine' : 'other']">
        <!-- 对方头像可点击 -->
        <img
          v-if="msg.sender_id !== currentUserId"
          :src="otherUser?.avatar_url || '/default-avatar.png'"
          class="avatar"
          @click="goToUserProfile(otherUser?.id)"
        />
        <div class="bubble">
          <div v-if="msg.type === 'text'" class="text">{{ msg.content }}</div>
          <div v-if="msg.type === 'image'" class="image-message">
            <img :src="msg.content" @click="previewImage(msg.content)" />
          </div>
          <div v-if="msg.type === 'file'" class="file-message">
            <a :href="msg.content" target="_blank">📎 {{ msg.metadata?.name || '文件' }}</a>
          </div>
          <span class="time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <!-- 自己头像可点击 -->
        <img
          v-if="msg.sender_id === currentUserId"
          :src="currentUserAvatar || '/default-avatar.png'"
          class="avatar"
          @click="goToUserProfile(currentUserId)"
        />
      </div>
    </div>
    <div class="input-area">
      <input type="text" v-model="newMessage" @keyup.enter="sendTextMessage" placeholder="输入消息..." />
      <input type="file" ref="fileInput" @change="sendFile" style="display:none" />
      <button @click="$refs.fileInput.click()" class="attach-btn">📎</button>
      <button @click="sendTextMessage" :disabled="!newMessage.trim()">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getMessages, sendMessage } from '@/api/message';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 使用计算属性确保响应式
const currentUserId = computed(() => userStore.user?.value?.id);
const currentUserAvatar = computed(() => userStore.user?.value?.avatar_url);

// 调试输出（可保留或删除）
console.log('当前用户ID:', currentUserId.value);

const conversationId = parseInt(route.params.conversationId);
if (isNaN(conversationId)) {
  console.error('无效的会话ID');
  router.push('/messages');
}

// 从 query 获取对方信息
const otherId = route.query.otherId;
const otherName = route.query.otherName;
const otherAvatar = route.query.otherAvatar;

const messages = ref([]);
const otherUser = ref({ id: otherId, username: otherName, avatar_url: otherAvatar });
const newMessage = ref('');
const loading = ref(false);
const messageList = ref(null);
const fileInput = ref(null);

const fetchMessages = async () => {
  try {
    const res = await getMessages(conversationId);
    messages.value = res.data.list;
    if (messages.value.length > 0) {
      console.log('第一条消息 sender_id:', messages.value[0].sender_id);
    }
  } catch (err) {
    console.error('获取消息失败', err);
  }
};

const sendTextMessage = async () => {
  if (!newMessage.value.trim()) return;
  if (!otherUser.value.id) {
    alert('对方用户信息缺失');
    return;
  }
  const content = newMessage.value;
  newMessage.value = '';
  try {
    const res = await sendMessage({
      receiverId: otherUser.value.id,
      content,
      type: 'text',
    });
    messages.value.push(res.data.data);
    scrollToBottom();
  } catch (err) {
    console.error('发送失败', err);
    newMessage.value = content;
  }
};

const sendFile = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!otherUser.value.id) {
    alert('对方用户信息缺失');
    return;
  }

  const isImage = file.type.startsWith('image/');
  let fileUrl = '';

  try {
    const ext = file.name.split('.').pop();
    const fileName = `chat/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage
      .from('files')
      .upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(fileName);
    fileUrl = urlData.publicUrl;
  } catch (err) {
    console.error('文件上传失败', err);
    alert('上传失败');
    return;
  }

  try {
    const res = await sendMessage({
      receiverId: otherUser.value.id,
      content: fileUrl,
      type: isImage ? 'image' : 'file',
      metadata: { name: file.name, size: file.size }
    });
    messages.value.push(res.data.data);
    scrollToBottom();
  } catch (err) {
    console.error('发送文件消息失败', err);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  });
};

const goBack = () => router.back();

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhCN });
};

const previewImage = (url) => {
  window.open(url, '_blank');
};

// 跳转到用户个人主页
const goToUserProfile = (userId) => {
  if (userId) {
    router.push(`/profile/${userId}`);
  } else {
    console.warn('尝试跳转到空用户ID');
  }
};

onMounted(() => {
  if (!isNaN(conversationId)) {
    fetchMessages();
  }
  scrollToBottom();
});

watch(messages, () => {
  scrollToBottom();
}, { deep: true });
</script>

<style scoped>
.chat-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f0f2f5;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.chat-header {
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
  margin-right: 12px;
  cursor: pointer;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-end;
}
.message-item.mine {
  flex-direction: row-reverse;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin: 0 8px;
  object-fit: cover;
  cursor: pointer;
}
.bubble {
  max-width: 70%;
  background-color: white;
  border-radius: 18px;
  padding: 10px 14px;
  position: relative;
  word-wrap: break-word;
}
.mine .bubble {
  background-color: #007bff;
  color: white;
}
.bubble .time {
  font-size: 10px;
  color: #6c757d;
  margin-left: 8px;
  opacity: 0.7;
}
.mine .bubble .time {
  color: rgba(255,255,255,0.7);
}
.image-message img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
}
.file-message a {
  color: inherit;
  text-decoration: underline;
}
.input-area {
  display: flex;
  padding: 12px 16px;
  background-color: white;
  border-top: 1px solid #dee2e6;
  align-items: center;
}
.input-area input[type="text"] {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ced4da;
  border-radius: 24px;
  font-size: 16px;
  outline: none;
}
.input-area button {
  margin-left: 8px;
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
}
.input-area button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.attach-btn {
  background-color: #6c757d !important;
  font-size: 18px;
  padding: 10px 12px !important;
}
</style>