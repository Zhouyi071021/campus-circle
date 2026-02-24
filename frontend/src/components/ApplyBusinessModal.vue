<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>申请成为商家</h3>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>店铺名称 <span class="required">*</span></label>
          <input v-model="form.store_name" required maxlength="100" />
        </div>
        <div class="form-group">
          <label>联系电话 <span class="required">*</span></label>
          <input v-model="form.contact_phone" required type="tel" placeholder="11位手机号" />
        </div>
        <div class="form-group">
          <label>微信号</label>
          <input v-model="form.contact_wechat" />
        </div>
        <div class="form-group">
          <label>营业执照图片（选填）</label>
          <input type="file" accept="image/*" @change="handleFileUpload" />
          <div v-if="uploading" class="uploading">上传中...</div>
        </div>
        <div class="form-group">
          <label>申请理由（选填）</label>
          <textarea v-model="form.reason" rows="3" maxlength="500"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" @click="$emit('close')">取消</button>
          <button type="submit" :disabled="submitting">{{ submitting ? '提交中...' : '提交申请' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { uploadFile } from '@/api/upload';
import { submitBusinessApplication } from '@/api/business';

const emit = defineEmits(['close', 'success']);

const form = reactive({
  store_name: '',
  contact_phone: '',
  contact_wechat: '',
  business_license: '',
  reason: '',
});
const uploading = ref(false);
const submitting = ref(false);

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploading.value = true;
  try {
    const res = await uploadFile(file);
    if (res.data.success) {
      form.business_license = res.data.url;
    } else {
      throw new Error(res.data.error || '上传失败');
    }
  } catch (err) {
    console.error('上传失败', err);
    alert('上传失败：' + (err.message || '未知错误'));
  } finally {
    uploading.value = false;
  }
};

const submit = async () => {
  submitting.value = true;
  try {
    const submitData = {
      store_name: form.store_name,
      contact_phone: form.contact_phone,
      contact_wechat: form.contact_wechat || null,
      business_license: form.business_license || null,
      reason: form.reason || null,
    };
    await submitBusinessApplication(submitData);
    emit('success');
    emit('close');
  } catch (err) {
    console.error('提交失败', err);
    alert(err.response?.data?.error || '提交失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}
.required {
  color: #dc3545;
}
.form-group input,
.form-group textarea {
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
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.modal-actions button:first-child {
  background-color: #6c757d;
  color: white;
}
.modal-actions button:last-child {
  background-color: #007bff;
  color: white;
}
.modal-actions button:last-child:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.uploading {
  font-size: 12px;
  color: #007bff;
  margin-top: 4px;
}
</style>