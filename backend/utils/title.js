export function getTitleByFollowers(count) {
  if (count >= 5000) return '校园传奇';
  if (count >= 1000) return '论坛元老';
  if (count >= 500) return '校园网红';
  if (count >= 100) return '社区达人';
  if (count >= 50) return '校园新星';
  return '';
}