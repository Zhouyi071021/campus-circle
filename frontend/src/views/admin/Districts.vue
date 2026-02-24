<template>
  <div class="admin-districts">
    <h2>地区管理</h2>
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新增地区</button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 地区卡片列表 -->
    <div v-else class="district-tree">
      <div v-for="county in counties" :key="county.id" class="county-card">
        <div class="card-header">
          <div class="title-area">
            <span class="district-name">{{ county.name }}</span>
            <span class="level-badge level-1">县区</span>
          </div>
          <div class="actions">
            <button @click="editDistrict(county)" class="btn-icon" title="编辑">✏️</button>
            <button @click="handleDeleteDistrict(county)" class="btn-icon delete" title="删除">🗑️</button>
            <button @click="addSubDistrict(county)" class="btn-icon" title="添加区域">+区域</button>
          </div>
        </div>

        <!-- 子区域列表（区域） -->
        <div v-if="county.children && county.children.length" class="children-list">
          <div v-for="district in county.children" :key="district.id" class="child-item">
            <div class="child-info">
              <span class="district-name">{{ district.name }}</span>
              <span class="level-badge level-2">区域</span>
            </div>
            <div class="actions">
              <button @click="editDistrict(district)" class="btn-icon" title="编辑">✏️</button>
              <button @click="handleDeleteDistrict(district)" class="btn-icon delete" title="删除">🗑️</button>
              <button @click="addSubDistrict(district)" class="btn-icon" title="添加学校">+学校</button>
            </div>
          </div>
        </div>
        <div v-else class="no-children">暂无子区域</div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingDistrict ? '编辑地区' : '新增地区' }}</h3>
        <form @submit.prevent="saveDistrict">
          <div class="form-group">
            <label>名称</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>级别</label>
            <select v-model="form.level" required>
              <option value="1">县区</option>
              <option value="2">区域</option>
              <option value="3">学校</option>
            </select>
          </div>
          <div class="form-group" v-if="form.level > 1">
            <label>父级地区</label>
            <select v-model="form.parent_id">
              <option value="">请选择</option>
              <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }} ({{ p.level === 1 ? '县区' : '区域' }})</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getDistricts, createDistrict, updateDistrict, deleteDistrict as deleteDistrictApi } from '@/api/admin';

const districts = ref([]);
const counties = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingDistrict = ref(null);
const saving = ref(false);
const form = ref({
  name: '',
  level: 1,
  parent_id: null,
});

// 获取所有地区并组织成树形
const fetchDistricts = async () => {
  loading.value = true;
  try {
    const res = await getDistricts();
    const all = res.data.data;
    // 按 parent_id 分组
    const map = {};
    all.forEach(d => map[d.id] = { ...d, children: [] });
    const roots = [];
    all.forEach(d => {
      if (d.parent_id) {
        if (map[d.parent_id]) map[d.parent_id].children.push(map[d.id]);
      } else {
        roots.push(map[d.id]);
      }
    });
    counties.value = roots.filter(r => r.level === 1);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 父级选项（用于表单）
const parentOptions = computed(() => {
  if (form.value.level === 2) {
    return counties.value;
  } else if (form.value.level === 3) {
    const regions = [];
    counties.value.forEach(c => {
      c.children.forEach(r => regions.push(r));
    });
    return regions;
  }
  return [];
});

const addSubDistrict = (parent) => {
  editingDistrict.value = null;
  form.value = {
    name: '',
    level: parent.level + 1,
    parent_id: parent.id,
  };
  showForm.value = true;
};

const editDistrict = (district) => {
  editingDistrict.value = district;
  form.value = { ...district };
  showForm.value = true;
};

const saveDistrict = async () => {
  saving.value = true;
  try {
    if (editingDistrict.value) {
      await updateDistrict(editingDistrict.value.id, form.value);
    } else {
      await createDistrict(form.value);
    }
    showForm.value = false;
    await fetchDistricts();
  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const handleDeleteDistrict = async (district) => {
  if (!confirm(`确定删除地区 ${district.name} 吗？`)) return;
  try {
    await deleteDistrictApi(district.id);
    await fetchDistricts();
  } catch (err) {
    console.error(err);
  }
};

onMounted(fetchDistricts);
</script>

<style scoped>
.admin-districts {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
}

.toolbar {
  margin-bottom: 24px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #0056b3;
}
.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.btn-icon:hover {
  background-color: #e9ecef;
}
.btn-icon.delete:hover {
  background-color: #f8d7da;
  color: #dc3545;
}

/* 卡片样式 */
.district-tree {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.county-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.county-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.district-name {
  font-size: 18px;
  font-weight: 500;
}

.level-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.level-badge.level-1 {
  background-color: #cfe2ff;
  color: #084298;
}
.level-badge.level-2 {
  background-color: #e2d9f3;
  color: #5528b0;
}
.level-badge.level-3 {
  background-color: #d1e7dd;
  color: #0a5e2a;
}

.actions {
  display: flex;
  gap: 8px;
}

.children-list {
  margin-left: 16px;
  border-left: 2px solid #dee2e6;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.child-item:hover {
  background-color: #e9ecef;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.no-children {
  margin-left: 16px;
  color: #6c757d;
  font-size: 14px;
  font-style: italic;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

/* 弹窗样式 */
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
  padding: 24px;
  width: 400px;
  max-width: 90%;
}
.modal-content h3 {
  margin-top: 0;
  font-size: 18px;
  font-weight: 500;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>