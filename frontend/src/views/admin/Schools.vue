<template>
  <div class="admin-schools">
    <h2>学校管理</h2>
    <div class="toolbar">
      <button @click="showForm = true" class="btn-primary">新增学校</button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Logo</th>
            <th>学校名称</th>
            <th>所属区域</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="school in schools" :key="school.id">
            <td>{{ school.id }}</td>
            <td><img :src="school.logo_url" class="logo" /></td>
            <td>{{ school.name }}</td>
            <td>{{ school.district_id }}</td>
            <td>
              <button @click="editSchool(school)">编辑</button>
              <button @click="handleDeleteSchool(school)" class="danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <div class="modal-content">
        <h3>{{ editingSchool ? '编辑学校' : '新增学校' }}</h3>
        <form @submit.prevent="saveSchool">
          <div class="form-group">
            <label>学校名称</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>所属区域ID</label>
            <input type="number" v-model="form.district_id" required />
          </div>
          <div class="form-group">
            <label>Logo URL</label>
            <input v-model="form.logo_url" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showForm = false">取消</button>
            <button type="submit" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSchools, createSchool, updateSchool, deleteSchool as deleteSchoolApi } from '@/api/admin'; // 导入时重命名

const schools = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingSchool = ref(null);
const saving = ref(false);
const form = ref({ name: '', district_id: null, logo_url: '' });

const fetchSchools = async () => {
  loading.value = true;
  try {
    const res = await getSchools();
    schools.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const editSchool = (school) => {
  editingSchool.value = school;
  form.value = { ...school };
  showForm.value = true;
};

const saveSchool = async () => {
  saving.value = true;
  try {
    if (editingSchool.value) {
      await updateSchool(editingSchool.value.id, form.value);
    } else {
      await createSchool(form.value);
    }
    showForm.value = false;
    await fetchSchools();
  } catch (err) {
    console.error(err);
  } finally {
    saving.value = false;
  }
};

// 将本地函数重命名为 handleDeleteSchool
const handleDeleteSchool = async (school) => {
  if (confirm(`确定删除学校 ${school.name} 吗？`)) {
    try {
      await deleteSchoolApi(school.id); // 调用重命名后的 API 函数
      await fetchSchools();
    } catch (err) {
      console.error('删除失败', err);
      alert('删除失败');
    }
  }
};

onMounted(fetchSchools);
</script>

<style scoped>
.admin-schools {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
.table th, .table td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
}
.logo {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}
button {
  padding: 4px 8px;
  margin-right: 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}
.danger {
  background-color: #dc3545;
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
  border-radius: 8px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}
.form-group input {
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
}
.modal-actions button {
  padding: 8px 16px;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}
</style>