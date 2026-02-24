import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMessageStore = defineStore('message', () => {
  const totalUnread = ref(0);
  const setTotalUnread = (count) => totalUnread.value = count;
  return { totalUnread, setTotalUnread };
});