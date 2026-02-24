import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // 从 storage 读取 token
  const token = ref(localStorage.getItem('token') || sessionStorage.getItem('token') || '');

  // 从 storage 读取用户信息，并处理可能的解析错误
  let initialUser = null;
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    try {
      initialUser = JSON.parse(userStr);
    } catch (e) {
      console.error('解析用户信息失败，清除无效数据', e);
      // 清除无效数据，避免后续干扰
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      token.value = ''; // 同时清除 token
    }
  }
  const user = ref(initialUser);

  const isLoggedIn = computed(() => !!token.value && !!user.value);

  function setToken(newToken, remember = false) {
    token.value = newToken;
    if (remember) {
      localStorage.setItem('token', newToken);
    } else {
      sessionStorage.setItem('token', newToken);
    }
  }

  function setUserInfo(info, remember = false) {
    user.value = info;
    const str = JSON.stringify(info);
    if (remember) {
      localStorage.setItem('user', str);
    } else {
      sessionStorage.setItem('user', str);
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  return {
    token,
    user,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout,
  };
});