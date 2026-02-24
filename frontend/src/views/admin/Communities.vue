<template>
  <div class="admin-communities">
    <h2>社区审核</h2>

    <!-- 选项卡 -->
    <div class="tabs">
      <span
        :class="['tab', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'; fetchData(true)"
      >
        待审核
      </span>
      <span
        :class="['tab', { active: activeTab === 'approved' }]"
        @click="activeTab = 'approved'; fetchData(true)"
      >
        已通过
      </span>
      <span
        :class="['tab', { active: activeTab === 'rejected' }]"
        @click="activeTab = 'rejected'; fetchData(true)"
      >
        已拒绝
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 卡片列表 -->
    <div v-else>
      <div v-if="communities.length === 0" class="empty">暂无数据</div>
      <div v-else class="card-list">
        <div v-for="item in communities" :key="item.id" class="community-card">
          <div class="card-header">
            <div class="header-left">
              <img :src="item.cover_url" class="cover" />
              <div>
                <h3>{{ item.name }}</h3>
                <span class="category">{{ item.category || '未分类' }}</span>
              </div>
            </div>
            <!-- 状态徽章，根据实际状态显示不同颜色 -->
            <span :class="['badge', item.status]">
              {{ statusText(item.status) }}
            </span>
          </div>

          <div class="card-content">
            <div class="info-row">
              <span class="label">创建者：</span>
              <span class="value">{{ item.creator?.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">成员数：</span>
              <span class="value">{{ item.member_count }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交时间：</span>
              <span class="value">{{ formatDate(item.created_at) }}</span>
            </div>
            <div v-if="item.rules" class="rules">
              <span class="label">社区规则：</span>
              <p class="value">{{ item.rules }}</p>
            </div>
            <div v-if="item.reject_reason && activeTab === 'rejected'" class="reject-reason">
              <span class="label">拒绝原因：</span>
              <p class="value">{{ item.reject_reason }}</p>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-left">
              <button @click="viewDetail(item)" class="btn-text">查看详情</button>
            </div>
            <div class="footer-right">
              <!-- 仅待审核状态显示通过/拒绝按钮 -->
              <template v-if="activeTab === 'pending'">
                <button @click="approve(item)" class="btn-approve" title="通过">✓ 通过</button>
                <button @click="reject(item)" class="btn-reject" title="拒绝">✗ 拒绝</button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页/加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">加载更多</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  getPendingCommunities,
  approveCommunity,
  rejectCommunity,
  getCommunities // 假设后端已添加通用接口，需要先在 api/admin.js 中定义
} from '@/api/admin';
import { format } from 'date-fns';

const activeTab = ref('pending');
const communities = ref([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(true);
const loading = ref(false);

// 状态显示文本
const statusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return map[status] || status;
};

const fetchData = async (reset = false) => {
  if (reset) {
    page.value = 1;
    communities.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    let res;
    if (activeTab.value === 'pending') {
      // 使用原有的待审核接口
      res = await getPendingCommunities(page.value, pageSize);
      // 注意：getPendingCommunities 返回的列表中的 status 可能未包含，但我们可以假设它为 'pending'
      // 如果返回的数据中没有 status 字段，可以手动添加
      res.data.list.forEach(item => item.status = 'pending');
    } else {
      // 使用通用接口，传入 status 参数
      const params = { page: page.value, pageSize, status: activeTab.value };
      res = await getCommunities(params); // 需要在 api/admin.js 中定义此函数
    }
    communities.value.push(...res.data.list);
    hasMore.value = communities.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取社区数据失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchData();

const formatDate = (d) => format(new Date(d), 'yyyy-MM-dd HH:mm');

const viewDetail = (item) => {
  alert(`社区规则：${item.rules || '无'}`);
};

const approve = async (item) => {
  if (confirm('确定通过该社区？')) {
    await approveCommunity(item.id);
    // 移除当前项，或者重新获取列表
    communities.value = communities.value.filter(i => i.id !== item.id);
  }
};

const reject = async (item) => {
  const reason = prompt('请输入拒绝原因（可选）');
  if (reason === null) return;
  await rejectCommunity(item.id, reason);
  communities.value = communities.value.filter(i => i.id !== item.id);
};

onMounted(() => fetchData(true));
</script>

<style scoped>
.admin-communities {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

/* 选项卡样式 */
.tabs {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 20px;
}
.tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #6c757d;
  border-bottom: 2px solid transparent;
}
.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.community-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.community-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 500;
}

.category {
  font-size: 12px;
  color: #6c757d;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.badge.pending {
  background-color: #fff3cd;
  color: #856404;
}
.badge.approved {
  background-color: #d4edda;
  color: #155724;
}
.badge.rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.card-content {
  margin-bottom: 16px;
}

.info-row {
  font-size: 14px;
  margin-bottom: 6px;
  color: #495057;
}
.label {
  color: #6c757d;
  font-weight: 500;
}
.value {
  color: #212529;
  margin-left: 4px;
}

.rules {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f3f5;
}
.rules p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #495057;
  white-space: pre-wrap;
}

.reject-reason {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8d7da;
  border-radius: 4px;
}
.reject-reason .label {
  color: #721c24;
  font-weight: 600;
}
.reject-reason .value {
  color: #721c24;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f3f5;
  padding-top: 12px;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.btn-text:hover {
  text-decoration: underline;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.btn-approve,
.btn-reject {
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-approve {
  background-color: #28a745;
  color: white;
}
.btn-approve:hover {
  background-color: #218838;
}
.btn-reject {
  background-color: #dc3545;
  color: white;
}
.btn-reject:hover {
  background-color: #c82333;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}
.load-more:hover {
  text-decoration: underline;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>