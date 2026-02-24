<template>
  <div class="sponsor-container">
    <header class="sponsor-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>赞助我们</h2>
    </header>

    <div class="content">
      <p class="thank-you">您的支持让我们更有动力！打赏金额随意，多少都是心意。</p>

      <div class="qrcodes">
        <div class="qrcode-item">
          <img :src="wechatQR" alt="微信收款码" />
          <p>微信</p>
        </div>
        <div class="qrcode-item">
          <img :src="alipayQR" alt="支付宝收款码" />
          <p>支付宝</p>
        </div>
      </div>

      <div v-if="sponsors.length" class="sponsor-records">
        <h3>赞助记录</h3>
        <div v-for="s in sponsors" :key="s.id" class="record-item">
          <img :src="s.user?.avatar_url || '/default-avatar.png'" class="avatar" />
          <span class="name">{{ s.user?.username || '匿名' }}</span>
          <span class="amount">￥{{ s.amount }}</span>
          <span class="time">{{ formatTime(s.created_at) }}</span>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSponsors } from '@/api/sponsor'; // 需创建
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '@/components/layout/BottomNav.vue';

const router = useRouter();
const wechatQR = '/images/wechat-qr.png'; // 实际图片路径
const alipayQR = '/images/alipay-qr.png';
const sponsors = ref([]);

const fetchSponsors = async () => {
  try {
    const res = await getSponsors();
    sponsors.value = res.data.data;
  } catch (err) {
    console.error('获取赞助记录失败', err);
  }
};

const formatTime = (ts) => formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN });
const goBack = () => router.back();

onMounted(() => {
  fetchSponsors();
});
</script>

<style scoped>
.sponsor-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.sponsor-header {
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
  padding: 20px;
}
.thank-you {
  text-align: center;
  font-size: 16px;
  color: #495057;
  margin-bottom: 30px;
}
.qrcodes {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}
.qrcode-item {
  text-align: center;
}
.qrcode-item img {
  width: 150px;
  height: 150px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  background-color: white;
}
.qrcode-item p {
  margin-top: 8px;
  font-weight: 600;
}
.sponsor-records h3 {
  margin-bottom: 12px;
  font-size: 18px;
}
.record-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f5;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 12px;
}
.name {
  flex: 1;
  font-weight: 500;
}
.amount {
  color: #dc3545;
  font-weight: 600;
  margin-right: 12px;
}
.time {
  font-size: 12px;
  color: #6c757d;
}
</style>