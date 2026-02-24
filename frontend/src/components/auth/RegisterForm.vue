<template>
  <form @submit.prevent="handleRegister" class="register-form">
    <!-- 头像上传 -->
    <div class="form-group avatar-group">
      <label>头像</label>
      <div class="avatar-upload">
        <div class="avatar-preview">
          <img :src="avatarPreview || '/default-avatar.png'" class="avatar" />
        </div>
        <label class="upload-btn" :class="{ disabled: uploading }">
          <input
            type="file"
            accept="image/*"
            @change="handleAvatarUpload"
            :disabled="uploading"
            hidden
          />
          {{ uploading ? '上传中...' : '选择头像' }}
        </label>
      </div>
    </div>

    <!-- 用户名 -->
    <div class="form-group">
      <input
        type="text"
        v-model="form.username"
        @input="debouncedCheckUsername"
        placeholder="用户名（3-20字符，字母、数字、下划线）"
        required
      />
      <span v-if="usernameStatus" class="field-status" :class="usernameStatusClass">
        {{ usernameStatus }}
      </span>
    </div>

    <!-- 密码 -->
    <div class="form-group">
      <input
        :type="showPassword ? 'text' : 'password'"
        v-model="form.password"
        placeholder="密码（8-20字符）"
        required
      />
      <span class="toggle-password" @click="showPassword = !showPassword">
        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
      </span>
    </div>

    <!-- 确认密码 -->
    <div class="form-group">
      <input
        :type="showConfirmPassword ? 'text' : 'password'"
        v-model="form.confirmPassword"
        placeholder="重复密码"
        required
      />
      <span class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
        {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
      </span>
      <span v-if="passwordMatch !== null" class="field-status" :class="passwordMatchClass">
        {{ passwordMatch ? '✓' : '✗ 密码不一致' }}
      </span>
    </div>

    <!-- 三级地区选择器 -->
    <div class="region-selector">
      <div class="select-row">
        <select v-model="selectedCounty" @change="onCountyChange" required>
          <option value="" disabled selected>请选择县区</option>
          <option v-for="c in counties" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="select-row">
        <select v-model="selectedDistrict" @change="onDistrictChange" :disabled="!districts.length">
          <option value="" disabled selected>请选择区域</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
      <div class="select-row school-search">
        <select v-model="form.schoolId" :disabled="!schools.length">
          <option value="" disabled selected>请选择学校</option>
          <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div v-if="form.schoolId" class="school-warning">
        ⚠️ 选择后不可修改！
      </div>
    </div>

    <!-- 选填信息（折叠） -->
    <details class="optional-fields">
      <summary>选填信息（QQ、微信等）</summary>
      <div class="form-group">
        <input type="text" v-model="form.qq" placeholder="QQ号" />
      </div>
      <div class="form-group">
        <input type="text" v-model="form.wechat" placeholder="微信号" />
      </div>
      <div class="form-group">
        <input type="email" v-model="form.email" placeholder="邮箱" />
      </div>
      <div class="form-group">
        <input type="tel" v-model="form.phone" placeholder="电话号码" />
      </div>
    </details>

    <!-- 用户协议（从后端获取，需滚动到底部） -->
    <div class="agreement-box">
      <div v-if="agreementsLoading" class="agreement-loading">加载协议中...</div>
      <template v-else>
        <div class="agreement-scroll" ref="agreementScroll" @scroll="onAgreementScroll">
          <div class="agreement-content">
            <h3>用户协议</h3>
            <div v-html="agreementUser"></div>
            <h3>隐私政策</h3>
            <div v-html="agreementPrivacy"></div>
            <h3>社区规范</h3>
            <div v-html="agreementCommunity"></div>
          </div>
        </div>
        <div class="agreement-checkboxes" v-if="agreementScrolled">
          <label>
            <input type="checkbox" v-model="agreedUser" /> 我已阅读并同意《用户协议》
          </label>
          <label>
            <input type="checkbox" v-model="agreedPrivacy" /> 我已阅读并同意《隐私政策》
          </label>
          <label>
            <input type="checkbox" v-model="agreedCommunity" /> 我已阅读并同意《社区规范》
          </label>
        </div>
        <div v-else class="agreement-hint">请滚动阅读完所有协议</div>
      </template>
    </div>

    <!-- 注册按钮 -->
    <button type="submit" class="btn-register" :disabled="!canRegister">
      {{ loading ? '注册中...' : '注册' }}
    </button>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- 已有账号跳转 -->
    <div class="login-link">
      已有账号？
      <span @click="$emit('switch-to-login')">立即登录</span>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash-es';
import { checkUsername, register } from '../../api/auth';
import { getCounties, getDistricts, getSchools } from '../../api/district';
import { getAgreement } from '../../api/settings';
import { compressImage } from '../../utils/image';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '@/stores/user';

const emit = defineEmits(['switch-to-login']);
const router = useRouter();
const userStore = useUserStore();

// 表单数据
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  schoolId: null,
  qq: '',
  wechat: '',
  email: '',
  phone: '',
  avatar_url: '',
});

// 头像相关
const avatarPreview = ref('');
const uploading = ref(false);

// 密码显示
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 用户名查重状态
const usernameStatus = ref('');
const usernameStatusClass = ref('');
const usernameAvailable = ref(false);

// 密码一致性
const passwordMatch = computed(() => {
  if (!form.password || !form.confirmPassword) return null;
  return form.password === form.confirmPassword;
});
const passwordMatchClass = computed(() => 
  passwordMatch.value ? 'valid' : 'invalid'
);

// 地区数据
const counties = ref([]);
const districts = ref([]);
const schools = ref([]);
const selectedCounty = ref('');
const selectedDistrict = ref('');

// 协议相关
const agreementUser = ref('');
const agreementPrivacy = ref('');
const agreementCommunity = ref('');
const agreementsLoading = ref(true);
const agreementScroll = ref(null);
const agreementScrolled = ref(false);
const agreedUser = ref(false);
const agreedPrivacy = ref(false);
const agreedCommunity = ref(false);

// 状态
const loading = ref(false);
const error = ref('');

// 头像上传
const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploading.value = true;
  try {
    const compressedFile = await compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.8 });
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(compressedFile);

    const ext = file.name.split('.').pop();
    const fileName = `avatars/${uuidv4()}.${ext}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    form.avatar_url = urlData.publicUrl;
  } catch (err) {
    console.error('头像上传失败:', err);
    alert('头像上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};

// 用户名查重
const debouncedCheckUsername = debounce(async () => {
  const username = form.username;
  if (username.length < 3 || username.length > 20) {
    usernameStatus.value = '长度需3-20字符';
    usernameStatusClass.value = 'invalid';
    usernameAvailable.value = false;
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    usernameStatus.value = '只能包含字母、数字、下划线';
    usernameStatusClass.value = 'invalid';
    usernameAvailable.value = false;
    return;
  }
  try {
    const res = await checkUsername(username);
    if (res.data.exists) {
      usernameStatus.value = '✗ 用户名已存在';
      usernameStatusClass.value = 'invalid';
      usernameAvailable.value = false;
    } else {
      usernameStatus.value = '✓ 用户名可用';
      usernameStatusClass.value = 'valid';
      usernameAvailable.value = true;
    }
  } catch (err) {
    console.error('查重失败', err);
    usernameStatus.value = '查重失败';
    usernameStatusClass.value = 'invalid';
    usernameAvailable.value = false;
  }
}, 500);

// 加载县区
const loadCounties = async () => {
  try {
    const res = await getCounties();
    counties.value = res.data.data;
  } catch (err) {
    console.error('加载县区失败', err);
  }
};

// 县区变化
const onCountyChange = async () => {
  selectedDistrict.value = '';
  districts.value = [];
  schools.value = [];
  form.schoolId = null;
  if (!selectedCounty.value) return;
  try {
    const res = await getDistricts(selectedCounty.value);
    districts.value = res.data.data;
  } catch (err) {
    console.error('加载区域失败', err);
  }
};

// 区域变化
const onDistrictChange = async () => {
  schools.value = [];
  form.schoolId = null;
  if (!selectedDistrict.value) return;
  try {
    const res = await getSchools(selectedDistrict.value);
    schools.value = res.data.data;
  } catch (err) {
    console.error('加载学校失败', err);
  }
};

// 加载协议内容
const loadAgreements = async () => {
  agreementsLoading.value = true;
  try {
    const [userRes, privacyRes, communityRes] = await Promise.all([
      getAgreement('user'),
      getAgreement('privacy'),
      getAgreement('community'),
    ]);
    agreementUser.value = userRes.data.data || '用户协议内容加载失败';
    agreementPrivacy.value = privacyRes.data.data || '隐私政策内容加载失败';
    agreementCommunity.value = communityRes.data.data || '社区规范内容加载失败';
  } catch (err) {
    console.error('加载协议失败', err);
    agreementUser.value = '协议内容加载失败，请稍后重试';
    agreementPrivacy.value = '协议内容加载失败，请稍后重试';
    agreementCommunity.value = '协议内容加载失败，请稍后重试';
  } finally {
    agreementsLoading.value = false;
  }
};

// 监听协议滚动
const onAgreementScroll = (e) => {
  const el = e.target;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 2) {
    agreementScrolled.value = true;
  }
};

// 检查是否可以注册
const canRegister = computed(() => {
  return (
    usernameAvailable.value &&
    passwordMatch.value &&
    form.schoolId &&
    agreedUser.value &&
    agreedPrivacy.value &&
    agreedCommunity.value &&
    !loading.value &&
    !uploading.value &&
    !agreementsLoading.value
  );
});

// 提交注册
const handleRegister = async () => {
  if (!canRegister.value) return;
  loading.value = true;
  error.value = '';

  try {
    const registerData = {
      username: form.username.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      schoolId: form.schoolId ? Number(form.schoolId) : null,
      qq: form.qq || null,
      wechat: form.wechat || null,
      email: form.email || null,
      phone: form.phone || null,
      avatar_url: form.avatar_url || '/default-avatar.png',
    };

    const res = await register(registerData);
    const { token, user } = res.data.data;

    // 存储到 store
    userStore.setToken(token, true);
    userStore.setUserInfo(user, true);

    router.push('/');
  } catch (err) {
    console.error('注册失败:', err.response?.data);
    error.value = err.response?.data?.errors?.[0]?.msg || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCounties();
  loadAgreements();
});
</script>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  position: relative;
}
.form-group input,
.select-row select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}
.form-group input:focus,
.select-row select:focus {
  border-color: #007bff;
}
.toggle-password {
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  color: #6c757d;
  font-size: 20px;
}
.field-status {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 14px;
}
.field-status.valid {
  color: #28a745;
}
.field-status.invalid {
  color: #dc3545;
}
.region-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.select-row {
  width: 100%;
}
.school-warning {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}
.optional-fields {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px;
}
.optional-fields summary {
  cursor: pointer;
  color: #007bff;
  font-weight: 500;
}
.agreement-box {
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 12px;
}
.agreement-loading {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
.agreement-scroll {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  padding: 10px;
  font-size: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
.agreement-content {
  line-height: 1.5;
}
.agreement-checkboxes {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}
.agreement-hint {
  text-align: center;
  color: #6c757d;
  font-size: 12px;
  margin-top: 8px;
}
.btn-register {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-register:hover {
  background-color: #218838;
}
.btn-register:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.error-message {
  color: #dc3545;
  font-size: 14px;
  text-align: center;
}
.login-link {
  text-align: center;
  font-size: 14px;
  color: #6c757d;
}
.login-link span {
  color: #007bff;
  cursor: pointer;
  font-weight: 600;
}
.avatar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.avatar-preview .avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dee2e6;
}
.upload-btn {
  padding: 6px 12px;
  background-color: #e9ecef;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}
.upload-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>