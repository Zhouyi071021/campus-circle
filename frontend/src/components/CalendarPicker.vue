<template>
  <div class="calendar-picker">
    <div class="header">
      <button @click="prevMonth">&lt;</button>
      <span>{{ currentYear }}年{{ currentMonth }}月</span>
      <button @click="nextMonth">&gt;</button>
    </div>
    <div class="weekdays">
      <span v-for="day in weekdays" :key="day">{{ day }}</span>
    </div>
    <div class="days">
      <div
        v-for="(day, idx) in days"
        :key="idx"
        class="day-cell"
        :class="{
          'empty': !day,
          'has-posts': day && postCounts[day.date] && postCounts[day.date] > 0,
          'selected': modelValue === day?.date
        }"
        @click="day && selectDate(day.date)"
      >
        <span class="day-number">{{ day?.day }}</span>
        <span v-if="day && postCounts[day.date]" class="post-dots">
          <span :class="'dot-' + Math.min(postCounts[day.date], 3)"></span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getPostCountsByMonth } from '@/api/post';

const props = defineProps({
  modelValue: { type: String, default: '' } // 绑定选中的日期 YYYY-MM-DD
});
const emit = defineEmits(['update:modelValue', 'select']);

const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth() + 1);
const postCounts = ref({}); // { '2025-02-06': 23 }

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 生成当前月的日期网格
const days = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay(); // 0-6
  const lastDate = new Date(year, month, 0).getDate();

  const result = [];
  // 填充空白
  for (let i = 0; i < startWeekday; i++) {
    result.push(null);
  }
  // 填充日期
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    result.push({
      day: d,
      date: dateStr
    });
  }
  return result;
});

// 获取当月帖子统计
const fetchPostCounts = async () => {
  try {
    const res = await getPostCountsByMonth(currentYear.value, currentMonth.value);
    const counts = {};
    res.data.data.forEach(item => {
      counts[item.date] = item.count;
    });
    postCounts.value = counts;
  } catch (err) {
    console.error('获取帖子统计失败', err);
  }
};

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value--;
    currentMonth.value = 12;
  } else {
    currentMonth.value--;
  }
  fetchPostCounts();
};

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentYear.value++;
    currentMonth.value = 1;
  } else {
    currentMonth.value++;
  }
  fetchPostCounts();
};

const selectDate = (date) => {
  emit('update:modelValue', date);
  emit('select', date);
};

onMounted(() => {
  fetchPostCounts();
});

// 监听外部更改年份月份（如果有）
watch([currentYear, currentMonth], fetchPostCounts);
</script>

<style scoped>
.calendar-picker {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  max-width: 350px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header button {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  position: relative;
  cursor: pointer;
}
.day-cell.empty {
  background-color: transparent;
  cursor: default;
}
.day-number {
  font-size: 14px;
}
.has-posts .day-number {
  font-weight: 600;
  color: #007bff;
}
.post-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}
.dot-1, .dot-2, .dot-3 {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #007bff;
}
.dot-1 { background-color: #adb5bd; } /* 1-3个帖子灰色，可根据热度调整颜色 */
.dot-2 { background-color: #6c757d; }
.dot-3 { background-color: #007bff; }
.selected {
  background-color: #007bff;
  color: white;
}
.selected .day-number {
  color: white;
}
.selected .post-dots span {
  background-color: white;
}
</style>