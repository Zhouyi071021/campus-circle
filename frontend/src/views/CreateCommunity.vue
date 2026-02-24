<template>
  <div class="create-community-container">
    <header class="create-header">
      <button @click="goBack" class="back-btn">←</button>
      <h3>创建社区</h3>
      <button @click="submit" class="submit-btn" :disabled="!canSubmit">提交</button>
    </header>

    <form class="create-form" @submit.prevent="submit">
      <div class="form-group">
        <label>社区名称 <span class="required">*</span></label>
        <input type="text" v-model="form.name" maxlength="100" required />
      </div>
      <div class="form-group">
        <label>社区分类</label>
        <select v-model="form.category">
          <option value="">请选择</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>社区介绍</label>
        <textarea v-model="form.description" rows="4"></textarea>
      </div>
      <div class="form-group">
        <label>社区封面</label>
        <div class="cover-upload">
          <img v-if="form.cover_url" :src="form.cover_url" class="cover-preview" />
          <label class="upload-btn">
            <input type="file" accept="image/*" @change="handleCoverUpload" hidden />
            {{ form.cover_url ? '更换' : '上传封面' }}
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>社区规则</label>
        <textarea v-model="form.rules" rows="4" placeholder="请输入社区规则..."></textarea>
      </div>
      <div class="form-tip">
        提交后需管理员审核，请耐心等待。
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createCommunity } from '@/api/community';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = useRouter();
const form = reactive({
  name: '',
  category: '',
  description: '',
  rules: '',
  cover_url: '',
});
const categories = ['游戏', '动漫', '学习', '运动', '音乐', '其他'];
const uploading = ref(false);

const canSubmit = computed(() => form.name.trim() && !uploading.value);

const handleCoverUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploading.value = true;
  try {
    const ext = file.name.split('.').pop();
    const fileName = `community-covers/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    form.cover_url = urlData.publicUrl;
  } catch (err) {
    console.error('封面上传失败', err);
    alert('上传失败');
  } finally {
    uploading.value = false;
  }
};

const submit = async () => {
  if (!canSubmit.value) return;
  try {
    const res = await createCommunity(form);
    alert('创建成功，请等待审核');
    router.push('/communities');
  } catch (err) {
    console.error('创建失败', err);
    alert('创建失败：' + (err.response?.data?.error || '未知错误'));
  }
};

const goBack = () => router.back();
</script>

<style scoped>
.create-community-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: white;
  min-height: 100vh;
}
.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.submit-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}
.submit-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.create-form {
  padding: 16px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}
.required {
  color: #dc3545;
}
.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.cover-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cover-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}
.upload-btn {
  padding: 8px 16px;
  background-color: #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.form-tip {
  background-color: #fff3cd;
  color: #856404;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 16px;
}
</style>