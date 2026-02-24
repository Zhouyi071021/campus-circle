<template>
  <div class="business-container">
    <header class="business-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>周边服务</h2>
      <div class="filter-bar">
        <select v-model="categoryFilter" @change="fetchBusinesses(true)">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="sortFilter" @change="fetchBusinesses(true)">
          <option value="created_at_desc">最新发布</option>
          <option value="view_count_desc">最多浏览</option>
          <option value="rating_desc">评分最高</option>
        </select>
      </div>
    </header>

    <!-- 商家申请入口（非商家用户且未申请或申请被拒时显示） -->
    <div v-if="!isBusiness && !hasPendingApplication" class="apply-section">
      <p>想发布商家服务？<span class="apply-link" @click="showApplyModal = true">申请成为商家</span></p>
    </div>
    <div v-else-if="hasPendingApplication" class="apply-status">
      您已提交商家申请，请等待审核
    </div>

    <div class="business-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="businesses.length === 0" class="empty">
        暂无服务信息
      </div>
      <div
        v-for="item in businesses"
        :key="item.id"
        class="business-card"
        @click="goToDetail(item.id)"
      >
        <div class="card-header">
          <span class="badge">商家认证</span>
          <span class="name">{{ item.user?.username }}</span>
          <span class="rating">⭐ {{ item.rating?.toFixed(1) || '暂无' }}</span>
        </div>
        <h3 class="title">{{ item.title }}</h3>
        <p class="description">{{ truncate(item.description, 60) }}</p>
        <div class="details">
          <span class="price">💰 {{ item.price_range || '面议' }}</span>
          <span class="location">📍 {{ item.location || '未知' }}</span>
          <span class="hours">🕐 {{ item.business_hours || '未设置' }}</span>
        </div>
        <div class="actions" @click.stop>
          <button @click="contactPhone(item)">📞 拨打</button>
          <button @click="contactWechat(item)">💬 微信</button>
          <button @click="contactQQ(item)">📱 QQ</button>
          <button @click="toggleFavorite(item)">⭐ 收藏</button>
        </div>
      </div>
    </div>

    <!-- 商家发布入口（仅商家可见） -->
    <div v-if="isBusiness" class="business-publish-fab" @click="goToPublish">
      <span>+</span>
    </div>

    <!-- 申请弹窗 -->
    <ApplyBusinessModal
      v-if="showApplyModal"
      @close="showApplyModal = false"
      @success="handleApplySuccess"
    />

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { getBusinesses } from '@/api/business';
import { getMyApplication } from '@/api/businessApplication';
import BottomNav from '@/components/layout/BottomNav.vue';
import ApplyBusinessModal from '@/components/ApplyBusinessModal.vue';

const userStore = useUserStore();
const router = useRouter();
const goBack = () => router.back();

const businesses = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const categoryFilter = ref('');
const sortFilter = ref('created_at_desc');
const categories = ['餐饮', '打印', '辅导', '二手', '其他'];

// 申请状态
const showApplyModal = ref(false);
const applicationStatus = ref(null); // pending, approved, rejected

const isBusiness = computed(() => userStore.user?.role === 'business');
const hasPendingApplication = computed(() => applicationStatus.value === 'pending');

const fetchBusinesses = async (reset = false) => {
  if (reset) {
    page.value = 1;
    businesses.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    let sort = 'created_at';
    let order = 'desc';
    if (sortFilter.value === 'view_count_desc') {
      sort = 'view_count';
      order = 'desc';
    } else if (sortFilter.value === 'rating_desc') {
      sort = 'rating';
      order = 'desc';
    }
    const params = {
      page: page.value,
      pageSize,
      category: categoryFilter.value,
      sort,
      order,
    };
    const res = await getBusinesses(params);
    const { list, total } = res.data;
    businesses.value.push(...list);
    hasMore.value = businesses.value.length < total;
    page.value++;
  } catch (err) {
    console.error('获取服务失败', err);
  } finally {
    loading.value = false;
  }
};

// 获取用户申请状态
const fetchApplicationStatus = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const res = await getMyApplication();
    applicationStatus.value = res.data.data?.status;
  } catch (err) {
    console.error('获取申请状态失败', err);
  }
};

const handleApplySuccess = () => {
  applicationStatus.value = 'pending';
};

const truncate = (text, len) => {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
};

const contactPhone = (item) => {
  if (item.contact_phone) {
    window.location.href = `tel:${item.contact_phone}`;
  } else {
    alert('暂无电话');
  }
};
const contactWechat = (item) => {
  if (item.contact_wechat) {
    alert(`微信号：${item.contact_wechat}`);
  } else {
    alert('暂无微信');
  }
};
const contactQQ = (item) => {
  if (item.contact_qq) {
    window.location.href = `mqqwpa://im/chat?chat_type=wpa&uin=${item.contact_qq}&version=1&src_type=web`;
  } else {
    alert('暂无QQ');
  }
};
const toggleFavorite = (item) => {
  alert('收藏功能开发中');
};

const goToPublish = () => {
  router.push('/business/create');
};

const goToDetail = (id) => {
  router.push(`/business/${id}`);
};

onMounted(() => {
  fetchBusinesses(true);
  fetchApplicationStatus();
});
</script>

<style scoped>
.business-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  margin-right: 12px;
  padding: 0;
}
.business-header h2 {
  margin: 0;
  font-size: 20px;
  flex: 1;
}
.filter-bar {
  display: flex;
  gap: 8px;
}
.filter-bar select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  background-color: white;
  font-size: 14px;
}
.apply-section, .apply-status {
  background-color: #fff3cd;
  color: #856404;
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  border-bottom: 1px solid #ffeeba;
}
.apply-link {
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}
.business-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 60px;
}
.business-list {
  padding: 12px;
}
.business-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
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
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.description {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
  line-height: 1.5;
}
.details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 13px;
  color: #495057;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions button {
  flex: 1;
  min-width: 70px;
  padding: 8px 4px;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}
.actions button:hover {
  background-color: #e9ecef;
}
.business-publish-fab {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  cursor: pointer;
  z-index: 30;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>














































































































































































































































































