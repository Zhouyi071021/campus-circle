<template>
  <div class="edit-profile-container">
    <header class="header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>编辑资料</h2>
      <button @click="save" class="save-btn" :disabled="saving">保存</button>
    </header>

    <div class="content">
      <form @submit.prevent="save">
        <!-- 头像 -->
        <div class="avatar-section">
          <img :src="form.avatar_url || '/default-avatar.png'" class="avatar" />
          <label class="change-avatar-btn">
            <input type="file" accept="image/*" @change="handleAvatarUpload" hidden />
            更换头像
          </label>
        </div>

        <!-- 用户名 -->
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="form.username" maxlength="50" required />
        </div>

        <!-- 个人简介 -->
        <div class="form-group">
          <label>个人简介</label>
          <textarea v-model="form.bio" rows="3" maxlength="200" placeholder="介绍一下自己..."></textarea>
          <span class="word-count">{{ form.bio.length }}/200</span>
        </div>

        <!-- QQ -->
        <div class="form-group">
          <label>QQ</label>
          <input type="text" v-model="form.qq" />
        </div>

        <!-- 微信 -->
        <div class="form-group">
          <label>微信</label>
          <input type="text" v-model="form.wechat" />
        </div>

        <!-- 邮箱（不可编辑，仅显示） -->
        <div class="form-group" v-if="user.email">
          <label>邮箱</label>
          <input type="email" :value="user.email" disabled />
        </div>

        <!-- 手机（不可编辑，仅显示） -->
        <div class="form-group" v-if="user.phone">
          <label>手机</label>
          <input type="tel" :value="user.phone" disabled />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { updateProfile } from '@/api/user';
import { supabase } from '@/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = useRouter();
const userStore = useUserStore();

// 安全获取当前用户对象（可能为 null）
const user = computed(() => userStore.user?.value ?? {});

const form = reactive({
  avatar_url: user.value.avatar_url || '',
  username: user.value.username || '',
  bio: user.value.bio || '',
  qq: user.value.qq || '',
  wechat: user.value.wechat || '',
});
const saving = ref(false);

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const ext = file.name.split('.').pop();
    const fileName = `avatars/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    form.avatar_url = urlData.publicUrl;
  } catch (err) {
    console.error('头像上传失败', err);
    alert('上传失败');
  }
};

const save = async () => {
  saving.value = true;
  try {
    await updateProfile(form);
    // 更新本地 store
    userStore.setUserInfo({ ...user.value, ...form });
    alert('保存成功');
    if (user.value?.id) {
      router.push(`/profile/${user.value.id}?t=${Date.now()}`);
    } else {
      router.push('/auth');
    }
  } catch (err) {
    console.error('保存失败', err);
    alert('保存失败');
  } finally {
    saving.value = false;
  }
};

const goBack = () => router.back();
</script>

<style scoped>
.edit-profile-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.save-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.content {
  padding: 20px;
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}
.change-avatar-btn {
  padding: 6px 12px;
  background-color: #e9ecef;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.form-group textarea {
  resize: vertical;
}
.form-group input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
.word-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}
</style>