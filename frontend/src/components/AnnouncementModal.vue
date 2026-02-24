<template>
  <div class="announcement-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>校园公告</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="list.length === 0" class="empty">暂无公告</div>
        <div v-else>
          <div v-for="item in list" :key="item.id" class="announcement-item" @click="viewDetail(item)">
            <div class="title">{{ item.title }}</div>
            <div class="meta">
              <span class="time">{{ formatDate(item.created_at) }}</span>
              <span v-if="item.attachments?.length" class="attachment">📎 {{ item.attachments.length }}个附件</span>
            </div>
            <p class="preview">{{ truncate(item.content, 60) }}</p>
          </div>
          <div v-if="hasMore" class="load-more" @click.stop="loadMore">加载更多</div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗（二级） -->
    <div v-if="showDetail" class="detail-modal" @click.self="showDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ currentDetail.title }}</h3>
          <button @click="showDetail = false" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="content" v-html="currentDetail.content.replace(/\n/g, '<br>')"></div>
          <div v-if="currentDetail.attachments?.length" class="attachments">
            <h4>附件</h4>
            <ul>
              <li v-for="url in currentDetail.attachments" :key="url">
                <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
                <span class="file-size" v-if="url.metadata?.size">({{ (url.metadata.size/1024).toFixed(1) }}KB)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAnnouncements } from '@/api/announcement';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const props = defineProps({
  // 可接收外部传入，如初始页码等
});
const emit = defineEmits(['close']);

const list = ref([]);
const page = ref(1);
const pageSize = 10;
const hasMore = ref(true);
const loading = ref(false);

const showDetail = ref(false);
const currentDetail = ref({});

const fetchAnnouncements = async (reset = false) => {
  if (reset) {
    page.value = 1;
    list.value = [];
    hasMore.value = true;
  }
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getAnnouncements(page.value, pageSize);
    list.value.push(...res.data.list);
    hasMore.value = list.value.length < res.data.total;
    page.value++;
  } catch (err) {
    console.error('获取公告失败', err);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => fetchAnnouncements();

const viewDetail = (item) => {
  currentDetail.value = item;
  showDetail.value = true;
};

const formatDate = (ts) => ts ? formatDistanceToNow(new Date(ts), { addSuffix: true, locale: zhCN }) : '';
const truncate = (text, len) => text?.length > len ? text.slice(0, len) + '...' : text;

onMounted(() => fetchAnnouncements(true));
</script>

<style scoped>
.announcement-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.announcement-item {
  padding: 12px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
}
.announcement-item:hover {
  background-color: #f8f9fa;
}
.title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}
.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}
.preview {
  font-size: 14px;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.load-more {
  text-align: center;
  padding: 12px;
  color: #007bff;
  cursor: pointer;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
.detail-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.detail-modal .modal-content {
  max-width: 600px;
}
.content {
  white-space: pre-wrap;
  line-height: 1.6;
}
.attachments {
  margin-top: 20px;
}
.attachments ul {
  list-style: none;
  padding: 0;
}
.attachments li {
  margin-bottom: 8px;
}
.attachments a {
  color: #007bff;
  text-decoration: none;
}
.file-size {
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
}
</style>