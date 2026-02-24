<template>
  <div class="business-create-container">
    <header class="create-header">
      <button @click="goBack" class="back-btn">←</button>
      <h3>发布服务</h3>
      <button @click="submit" class="submit-btn" :disabled="!canSubmit">发布</button>
    </header>

    <form class="create-form" @submit.prevent="submit">
      <div class="form-group">
        <label>服务名称 <span class="required">*</span></label>
        <input type="text" v-model="form.title" required />
      </div>
      <div class="form-group">
        <label>服务描述 <span class="required">*</span></label>
        <textarea v-model="form.description" rows="4" required></textarea>
      </div>
      <div class="form-group">
        <label>服务类型</label>
        <select v-model="form.category">
          <option value="">请选择</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>联系方式（至少填写一种）</label>
        <input type="tel" v-model="form.contact_phone" placeholder="电话" />
        <input type="text" v-model="form.contact_wechat" placeholder="微信" />
        <input type="text" v-model="form.contact_qq" placeholder="QQ" />
      </div>
      <div class="form-group">
        <label>价格范围</label>
        <input type="text" v-model="form.price_range" placeholder="如：20-50元" />
      </div>
      <div class="form-group">
        <label>服务地址</label>
        <input type="text" v-model="form.location" />
      </div>
      <div class="form-group">
        <label>营业时间</label>
        <input type="text" v-model="form.business_hours" placeholder="如：9:00-21:00" />
      </div>
      <div class="form-group">
        <label>上传图片（最多6张）</label>
        <div class="image-upload-area">
          <div v-for="(img, idx) in form.images" :key="idx" class="image-preview">
            <img :src="img" alt="preview" />
            <span class="remove" @click="removeImage(idx)">×</span>
          </div>
          <label v-if="form.images.length < 6" class="upload-btn" :class="{ disabled: uploading }">
            <input type="file" accept="image/*" multiple @change="handleImageUpload" :disabled="uploading" hidden />
            {{ uploading ? '上传中...' : '+' }}
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>上传附件（营业执照等，最多2个）</label>
        <div class="file-list">
          <div v-for="(file, idx) in form.attachments" :key="idx" class="file-item">
            {{ file.name }}
            <span class="remove" @click="removeAttachment(idx)">×</span>
          </div>
          <label v-if="form.attachments.length < 2" class="file-btn">
            <input type="file" @change="handleAttachmentUpload" hidden />
            + 添加附件
          </label>
        </div>
      </div>
      <div class="form-tip">
        每天限发1篇，提交后需审核（1-3个工作日）。今日还可发布 {{ remaining }} 篇。
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createBusiness, getRemainingToday } from '@/api/business';
import { supabase } from '@/utils/supabase';
import { compressImage } from '@/utils/image';
import { v4 as uuidv4 } from 'uuid';

const router = useRouter();
const form = reactive({
  title: '',
  description: '',
  category: '',
  contact_phone: '',
  contact_wechat: '',
  contact_qq: '',
  price_range: '',
  location: '',
  business_hours: '',
  images: [],
  attachments: [], // 存储文件对象，提交时需要上传得到URL
});
const categories = ['餐饮', '打印', '辅导', '二手', '其他'];
const uploading = ref(false);
const remaining = ref(1); // 今日剩余发布次数

// 检查是否至少填写一种联系方式
const hasContact = computed(() => {
  return form.contact_phone || form.contact_wechat || form.contact_qq;
});
const canSubmit = computed(() => {
  return form.title.trim() && form.description.trim() && hasContact.value && !uploading.value && remaining.value > 0;
});

// 获取剩余次数
const fetchRemaining = async () => {
  try {
    const res = await getRemainingToday();
    remaining.value = res.data.remaining;
  } catch (err) {
    console.error('获取剩余次数失败', err);
  }
};

// 图片上传
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (form.images.length + files.length > 6) {
    alert('最多上传6张图片');
    return;
  }
  uploading.value = true;
  try {
    for (const file of files) {
      const compressedFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.8 });
      const ext = file.name.split('.').pop();
      const fileName = `business/${uuidv4()}.${ext}`;
      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, compressedFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      form.images.push(urlData.publicUrl);
    }
  } catch (err) {
    console.error('图片上传失败', err);
    alert('上传失败');
  } finally {
    uploading.value = false;
  }
};

const removeImage = (index) => {
  form.images.splice(index, 1);
};

// 附件上传（简化：不上传云存储，只保留文件名，实际可上传到storage）
const handleAttachmentUpload = (e) => {
  const files = Array.from(e.target.files);
  if (form.attachments.length + files.length > 2) {
    alert('最多上传2个附件');
    return;
  }
  files.forEach(file => {
    // 模拟存储，实际应上传到服务器
    form.attachments.push(file);
  });
};
const removeAttachment = (index) => {
  form.attachments.splice(index, 1);
};

const submit = async () => {
  if (!canSubmit.value) return;
  try {
    // 附件需要先上传，这里简化，只传递文件名（实际需上传后获取URL）
    const attachmentNames = form.attachments.map(f => f.name);
    const postData = {
      ...form,
      attachments: attachmentNames,
      // 将contact字段整合
    };
    const res = await createBusiness(postData);
    alert('发布成功，等待审核');
    router.push('/business');
  } catch (err) {
    console.error('发布失败', err);
    alert('发布失败：' + (err.response?.data?.error || '未知错误'));
  }
};

const goBack = () => router.back();

onMounted(() => {
  fetchRemaining();
});
</script>

<style scoped>
.business-create-container {
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
.form-group input[type="tel"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
.remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.5);
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
.upload-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.file-list {
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 8px;
}
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  background-color: #f8f9fa;
  margin-bottom: 4px;
  border-radius: 4px;
}
.file-item .remove {
  position: static;
  background: none;
  color: #dc3545;
  font-size: 18px;
}
.file-btn {
  display: inline-block;
  padding: 8px 12px;
  background-color: #e9ecef;
  border-radius: 4px;
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