<template>
  <div class="ranking-widget">
    <div class="tabs">
      <span v-for="tab in tabs" :key="tab.type" :class="['tab', { active: activeTab === tab.type }]" @click="switchTab(tab.type)">
        {{ tab.name }}
      </span>
    </div>
    <div class="ranking-list">
      <div v-for="(item, index) in rankings" :key="item.id" class="ranking-item">
        <span class="rank" :class="'rank-' + (index+1)">{{ index+1 }}</span>
        <span class="name">{{ item.target_name }}</span>
        <span class="score">{{ item.score }}分</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getRankings } from '@/api/ranking';

const props = defineProps({
  initialType: { type: String, default: 'user' }
});

const tabs = [
  { type: 'user', name: '活跃用户' },
  { type: 'post', name: '热门帖子' },
  { type: 'school', name: '热门学校' }
];
const activeTab = ref(props.initialType);
const rankings = ref([]);

const fetchRankings = async (type) => {
  try {
    const res = await getRankings(type);
    // 假设后端返回 { success: true, data: [...] }
    rankings.value = res.data.data || [];
  } catch (err) {
    console.error('获取排行榜失败', err);
    rankings.value = [];
  }
};

const switchTab = (type) => {
  activeTab.value = type;
  fetchRankings(type);
};

watch(activeTab, fetchRankings, { immediate: true });
</script>

<style scoped>
/* 样式保持不变 */
.ranking-widget {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin: 12px;
}
.tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.tab {
  font-size: 16px;
  color: #6c757d;
  cursor: pointer;
}
.tab.active {
  color: #007bff;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
}
.ranking-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f5;
}
.rank {
  width: 30px;
  font-weight: 600;
  color: #6c757d;
}
.rank-1 { color: gold; }
.rank-2 { color: silver; }
.rank-3 { color: #cd7f32; }
.name {
  flex: 1;
  margin-left: 8px;
}
.score {
  color: #007bff;
  font-weight: 600;
}
</style>