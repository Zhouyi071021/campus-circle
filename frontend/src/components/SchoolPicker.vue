<template>
  <div class="school-picker">
    <div class="selected" @click="showModal = true">
      <span v-if="selectedSchools.length === 0">选择学校（最多3所）</span>
      <span v-else>
        {{ selectedSchools.map(s => s.name).join(', ') }}
      </span>
    </div>

    <div v-if="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-content">
        <h3>选择学校</h3>
        <input v-model="search" placeholder="搜索学校" class="search-input" />
        <div class="school-list">
          <div
            v-for="school in filteredSchools"
            :key="school.id"
            class="school-item"
            :class="{ selected: isSelected(school) }"
            @click="toggleSchool(school)"
          >
            <img :src="school.logo_url" class="logo" />
            <span>{{ school.name }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showModal = false">取消</button>
          <button @click="confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAllSchools } from '@/api/school'; // 请确保此 API 已实现

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);

const showModal = ref(false);
const search = ref('');
const allSchools = ref([]);
const selectedSchools = ref([...props.modelValue]);

// 加载学校列表
onMounted(async () => {
  try {
    const res = await getAllSchools();
    allSchools.value = res.data.data || [];
  } catch (err) {
    console.error('获取学校列表失败', err);
    allSchools.value = [];
  }
});

const filteredSchools = computed(() => {
  if (!search.value) return allSchools.value;
  return allSchools.value.filter(s => s.name.includes(search.value));
});

const isSelected = (school) => selectedSchools.value.some(s => s.id === school.id);

const toggleSchool = (school) => {
  const index = selectedSchools.value.findIndex(s => s.id === school.id);
  if (index >= 0) {
    selectedSchools.value.splice(index, 1);
  } else {
    if (selectedSchools.value.length < 3) {
      selectedSchools.value.push(school);
    } else {
      alert('最多选择3所学校');
    }
  }
};

const confirm = () => {
  emit('update:modelValue', selectedSchools.value);
  showModal.value = false;
};
</script>

<style scoped>
.selected {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 20px;
  cursor: pointer;
  background-color: white;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
.search-input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ced4da;
  border-radius: 8px;
}
.school-list {
  max-height: 300px;
  overflow-y: auto;
}
.school-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
}
.school-item.selected {
  background-color: #e7f3ff;
}
.logo {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 10px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.modal-actions button {
  flex: 1;
  padding: 10px;
}
</style>