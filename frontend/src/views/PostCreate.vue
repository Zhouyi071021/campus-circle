<template>
  <div class="post-create-container">
    <header class="post-header">
      <button @click="goBack" class="back-btn">←</button>
      <h2>发布新帖</h2>
      <button @click="publish" class="publish-btn" :disabled="!canPublish || publishing">
        {{ publishing ? '发布中...' : '发布' }}
      </button>
    </header>

    <div class="post-form">
      <!-- 标题 -->
      <div class="form-group">
        <input
          type="text"
          v-model="form.title"
          placeholder="标题（必填）"
          maxlength="200"
        />
      </div>

      <!-- 正文 -->
      <div class="form-group">
        <textarea
          v-model="form.content"
          placeholder="说点什么吧..."
          rows="6"
        ></textarea>
      </div>

      <!-- 文件上传区域（支持任意文件） -->
      <div class="form-group">
        <div class="upload-label">附件（最多9个，每个≤10MB）</div>
        <div class="image-upload-area">
          <div v-for="(fileUrl, index) in form.attachments" :key="index" class="image-preview">
            <img :src="fileUrl" alt="preview" />
            <span class="remove-image" @click="removeFile(index)">×</span>
          </div>
          <label v-if="form.attachments.length < 9" class="upload-btn" :class="{ disabled: uploading }">
            <input
              type="file"
              accept="*/*"
              multiple
              @change="handleFileUpload"
              :disabled="uploading"
              hidden
            />
            {{ uploading ? '上传中...' : '+' }}
          </label>
        </div>
      </div>

      <!-- 标签 -->
      <div class="form-group">
        <input
          type="text"
          v-model="tagInput"
          @keydown.enter.prevent="addTag"
          placeholder="输入标签，按回车添加"
        />
        <div class="tags">
          <span v-for="(tag, idx) in form.tags" :key="idx" class="tag">
            #{{ tag }}
            <span class="remove-tag" @click="removeTag(idx)">×</span>
          </span>
        </div>
      </div>

      <!-- 可见范围 -->
      <div class="form-group">
        <label>可见范围</label>
        <select v-model="form.visibility">
          <option value="public">公开（所有人可见）</option>
          <option value="school">仅本校</option>
          <option value="followers">仅关注者</option>
        </select>
      </div>

      <!-- 匿名选项 -->
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" v-model="form.isAnonymous" />
          匿名发布
        </label>
      </div>

      <!-- 学校选择 -->
      <div class="form-group" v-if="!form.isAnonymous">
        <label>学校</label>
        <select v-model="form.schoolId">
          <option v-if="userSchool" :value="userSchool.id">{{ userSchool.name }}</option>
          <option value="">不选择学校（公开）</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 关键：需要导入
import { useUserStore } from '@/stores/user';
import { createPost } from '@/api/post';
import { uploadFile } from '@/api/upload';
import { compressImage } from '@/utils/image';
import { v4 as uuidv4 } from 'uuid'; // 保留备用

const router = useRouter();
const route = useRoute(); // 添加这一行
const userStore = useUserStore();

const form = reactive({
  title: '',
  content: '',
  attachments: [],
  tags: [],
  visibility: 'public',
  isAnonymous: false,
  schoolId: null,
});

const tagInput = ref('');
const uploading = ref(false);
const publishing = ref(false);

const userSchool = computed(() => userStore.userInfo?.school);

const canPublish = computed(() => form.title.trim() && form.content.trim());

const goBack = () => router.back();

// 处理文件上传（通过后端代理）
const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (form.attachments.length + files.length > 9) {
    alert('最多上传9个文件');
    return;
  }

  uploading.value = true;
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件 ${file.name} 超过10MB，已跳过`);
        continue;
      }

      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
          });
        } catch (err) {
          console.error('图片压缩失败，将上传原文件', err);
        }
      }

      const res = await uploadFile(fileToUpload);
      if (res.data.success) {
        form.attachments.push(res.data.url);
      } else {
        throw new Error(res.data.error);
      }
    }
  } catch (err) {
    console.error('文件上传失败:', err);
    alert('上传失败：' + (err.message || '未知错误'));
  } finally {
    uploading.value = false;
  }
};

const removeFile = (index) => {
  form.attachments.splice(index, 1);
};

const addTag = () => {
  const tag = tagInput.value.trim();
  if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
    form.tags.push(tag);
    tagInput.value = '';
  }
};

const removeTag = (index) => {
  form.tags.splice(index, 1);
};

const publish = async () => {
  if (!canPublish.value) return;
  publishing.value = true;
  try {
    // 从路由参数获取 communityId（如果是从社区进入）
    const communityId = route.query.communityId || null;
    const postData = {
      title: form.title,
      content: form.content,
      images: form.attachments, // 注意字段名与后端一致
      tags: form.tags,
      visibility: form.visibility,
      isAnonymous: form.isAnonymous,
      schoolId: form.isAnonymous ? null : (form.schoolId || userSchool.value?.id),
    };
    // 如果有社区ID，则调用社区发帖接口（需额外处理，此处假设 createPost 支持 communityId）
    // 实际可能需要根据 communityId 调用不同 API，这里简化
    const res = await createPost(postData);
    if (res.data.success) {
      router.push(`/post/${res.data.data.id}`);
    }
  } catch (err) {
    console.error('发布失败', err);
    alert('发布失败：' + (err.response?.data?.error || err.message || '未知错误'));
  } finally {
    publishing.value = false;
  }
};

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/auth');
    return;
  }
  if (userSchool.value) {
    form.schoolId = userSchool.value.id;
  }
});
</script>

<style scoped>
.upload-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.post-create-container {
  max-width: 480px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  padding: 16px;
}
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}
.publish-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}
.publish-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.form-group {
  margin-bottom: 16px;
}
.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.form-group textarea {
  resize: vertical;
}
.upload-label {
  font-size: 14px;
  color: #495057;
  margin-bottom: 8px;
}
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}
.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border: 1px dashed #ced4da;
  border-radius: 8px;
  font-size: 30px;
  color: #6c757d;
  cursor: pointer;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.tag {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}
.remove-tag {
  margin-left: 6px;
  cursor: pointer;
  font-weight: bold;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>