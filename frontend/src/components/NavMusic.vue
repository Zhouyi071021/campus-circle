<template>
  <div class="nav-music" ref="container">
    <!-- 导航图标 -->
    <button class="music-trigger" @click="togglePanel" :class="{ active: showPanel }">
      <span class="icon">{{ playing ? '⏸' : '🎵' }}</span>
      <span v-if="playing && currentMusic" class="song-name">{{ currentMusic.title }}</span>
    </button>

    <!-- 浮层面板 -->
    <Transition name="pop">
      <div v-if="showPanel" class="music-panel" ref="panel">
        <!-- 封面和歌名 -->
        <div class="panel-header">
          <img :src="currentMusic?.cover || 'https://picsum.photos/48/48?random=music'" class="cover" />
          <div class="info">
            <div class="title">{{ currentMusic?.title || '未播放' }}</div>
            <div class="artist">{{ currentMusic?.artist || '未知艺术家' }}</div>
          </div>
        </div>

        <!-- 进度条（可点击） -->
        <div class="progress-bar" @click="seek">
          <div class="progress" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <!-- 控制按钮组 -->
        <div class="controls">
          <button @click="playPrev" :disabled="!musicList.length" class="ctrl-btn">⏮</button>
          <button @click="togglePlay" :disabled="!musicList.length" class="play-btn">
            {{ playing ? '⏸' : '▶' }}
          </button>
          <button @click="playNext" :disabled="!musicList.length" class="ctrl-btn">⏭</button>
        </div>

        <!-- 音量控制（迷你） -->
        <div class="volume-row">
          <span class="vol-icon">🔊</span>
          <input type="range" v-model.number="volume" min="0" max="100" @input="changeVolume" class="vol-slider" />
          <span class="vol-value">{{ volume }}%</span>
        </div>

        <!-- 播放计数 -->
        <div class="counter">
          {{ currentIndex + 1 }} / {{ musicList.length }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getMusicList } from '@/api/music';
import { useUserStore } from '@/stores/user';
import { updateUserSettings } from '@/api/settings';

const userStore = useUserStore();
const container = ref(null);
const panel = ref(null);

const showPanel = ref(false);
const playing = ref(false);
const musicList = ref([]);
const currentIndex = ref(0);
const audio = ref(null);
const volume = ref(50);
const progress = ref(0);
const duration = ref(0);

const currentMusic = computed(() => musicList.value[currentIndex.value] || null);
const progressPercent = computed(() => (duration.value ? (progress.value / duration.value) * 100 : 0));

// 加载音乐列表
const loadMusic = async () => {
  try {
    const res = await getMusicList({ status: 'active' });
    musicList.value = res.data.data || [];
  } catch (err) {
    console.error('加载音乐列表失败', err);
  }
};

// 初始化音频
const initAudio = () => {
  if (!audio.value) {
    audio.value = new Audio();
    audio.value.addEventListener('timeupdate', () => progress.value = audio.value.currentTime);
    audio.value.addEventListener('loadedmetadata', () => duration.value = audio.value.duration);
    audio.value.addEventListener('ended', playNext);
    audio.value.addEventListener('error', (e) => {
      console.error('音频错误', e);
      playNext();
    });
  }
};

const playCurrent = async () => {
  if (!musicList.value.length) return;
  initAudio();
  try {
    audio.value.src = currentMusic.value.url;
    audio.value.volume = volume.value / 100;
    await audio.value.play();
    playing.value = true;
  } catch (err) {
    console.error('播放失败', err);
    playing.value = false;
  }
};

const togglePlay = () => {
  if (!musicList.value.length) return;
  initAudio();
  if (!audio.value.src) {
    playCurrent();
    return;
  }
  if (playing.value) {
    audio.value.pause();
    playing.value = false;
  } else {
    audio.value.play().catch(console.error);
    playing.value = true;
  }
};

const playNext = () => {
  if (!musicList.value.length) return;
  currentIndex.value = (currentIndex.value + 1) % musicList.value.length;
  playCurrent();
};

const playPrev = () => {
  if (!musicList.value.length) return;
  currentIndex.value = (currentIndex.value - 1 + musicList.value.length) % musicList.value.length;
  playCurrent();
};

// 点击进度条跳转
const seek = (e) => {
  if (!audio.value || !duration.value) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  audio.value.currentTime = percent * duration.value;
};

const changeVolume = () => {
  if (audio.value) audio.value.volume = volume.value / 100;
};

const saveVolume = async () => {
  try {
    await updateUserSettings({ music_volume: volume.value });
  } catch (err) {
    console.error('保存音量设置失败', err);
  }
};

const togglePanel = () => {
  showPanel.value = !showPanel.value;
  if (showPanel.value && !audio.value) {
    initAudio();
  }
};

// 点击外部关闭面板
const handleClickOutside = (event) => {
  if (container.value && !container.value.contains(event.target)) {
    showPanel.value = false;
  }
};

watch(showPanel, (newVal) => {
  if (newVal) {
    document.addEventListener('click', handleClickOutside);
    // 确保面板不超出右侧
    setTimeout(() => {
      if (panel.value) {
        const rect = panel.value.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          panel.value.style.left = 'auto';
          panel.value.style.right = '0';
        }
      }
    }, 10);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (audio.value) {
    audio.value.pause();
    audio.value = null;
  }
});

onMounted(async () => {
  await loadMusic();
  if (userStore.settings?.music_volume !== undefined) {
    volume.value = userStore.settings.music_volume;
  }
});
</script>

<style scoped>
.nav-music {
  position: relative;
  display: inline-block;
}

/* 触发按钮 */
.music-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: #f1f3f4;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  color: #202124;
}
.music-trigger:hover {
  background: #e8eaed;
}
.music-trigger.active {
  background: #1a73e8;
  color: white;
}
.icon {
  font-size: 18px;
}
.song-name {
  max-width: 70px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
}

/* 面板 */
.music-panel {
  position: absolute;
  top: 45px;
  right: 0;
  width: 260px;
  max-width: calc(100vw - 30px);
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  color: #202124;
  font-size: 13px;
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.cover {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.info {
  flex: 1;
  min-width: 0;
}
.title {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.artist {
  color: #5f6368;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 进度条 */
.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin-bottom: 16px;
  cursor: pointer;
}
.progress {
  height: 100%;
  background: #1a73e8;
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* 控制按钮组 */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.ctrl-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #3c4043;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ctrl-btn:hover {
  background: rgba(0,0,0,0.05);
}
.ctrl-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.play-btn {
  background: #1a73e8;
  border: none;
  color: white;
  font-size: 28px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(26,115,232,0.3);
  cursor: pointer;
  transition: transform 0.1s;
}
.play-btn:hover {
  transform: scale(1.02);
}
.play-btn:disabled {
  opacity: 0.4;
  box-shadow: none;
}

/* 音量行 */
.volume-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.vol-icon {
  font-size: 14px;
  color: #5f6368;
}
.vol-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
}
.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1a73e8;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.vol-value {
  min-width: 35px;
  text-align: right;
  font-size: 12px;
  color: #5f6368;
}

/* 计数 */
.counter {
  text-align: center;
  font-size: 11px;
  color: #9aa0a6;
  margin-top: 8px;
}

/* 动画 */
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
































































































































































































































































































































































































