<template>
  <div class="business-detail-container">
    <header class="detail-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>{{ business.title }}</h2>
    </header>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="content">
      <div class="card-header">
        <span class="badge">商家认证</span>
        <span class="name">{{ business.user?.username }}</span>
        <span class="rating">⭐ {{ business.rating?.toFixed(1) || '暂无' }}</span>
      </div>
      <h3 class="title">{{ business.title }}</h3>
      <p class="description">{{ business.description }}</p>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">价格范围</span>
          <span>{{ business.price_range || '面议' }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务地址</span>
          <span>{{ business.location || '未知' }}</span>
        </div>
        <div class="info-item">
          <span class="label">营业时间</span>
          <span>{{ business.business_hours || '未设置' }}</span>
        </div>
      </div>
      <div class="contact-section">
        <h4>联系方式</h4>
        <div class="contact-item">
          <span>📞 电话：</span>
          <a :href="`tel:${business.contact_phone}`">{{ business.contact_phone || '未提供' }}</a>
        </div>
        <div class="contact-item" v-if="business.contact_wechat">
          <span>💬 微信：</span>
          <span>{{ business.contact_wechat }}</span>
        </div>
        <div class="contact-item" v-if="business.contact_qq">
          <span>📱 QQ：</span>
          <a :href="`mqqwpa://im/chat?chat_type=wpa&uin=${business.contact_qq}&version=1&src_type=web`" target="_blank">{{ business.contact_qq }}</a>
        </div>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getBusiness } from '@/api/business';
import BottomNav from '@/components/layout/BottomNav.vue';

const route = useRoute();
const router = useRouter();
const businessId = route.params.id;
const business = ref({});
const loading = ref(true);

const fetchBusiness = async () => {
  try {
    const res = await getBusiness(businessId);
    business.value = res.data.data;
  } catch (err) {
    console.error('获取详情失败', err);
  } finally {
    loading.value = false;
  }
};

const goBack = () => router.back();

onMounted(fetchBusiness);
</script>

<style scoped>
.business-detail-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.detail-header {
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
  margin-right: 12px;
}
.content {
  padding: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}
.badge {
  background-color: #ffc107;
  color: #212529;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.name {
  font-weight: 600;
}
.rating {
  margin-left: auto;
  color: #6c757d;
}
.title {
  font-size: 22px;
  margin-bottom: 12px;
}
.description {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.info-item {
  background-color: #f1f3f5;
  padding: 10px;
  border-radius: 8px;
}
.info-item .label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}
.contact-section {
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.contact-section h4 {
  margin: 0 0 12px 0;
}
.contact-item {
  margin-bottom: 8px;
}
.contact-item a {
  color: #007bff;
  text-decoration: none;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>