/**
 * 分类锚点跳转工具
 *
 * 修复移动端定位不准的问题：
 * 1. 使用 instant 跳转绕过全局 scroll-behavior:smooth 的平滑动画，
 *    避免动画期间布局变化导致停在半路；
 * 2. 跳转后延迟重定位两次，补偿懒加载图片撑开上方内容造成的位移
 *    （图片加载完布局稳定后，最终停在准确位置）。
 */
export function scrollToCategory(categoryId: string) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  const jump = () => el.scrollIntoView({ behavior: 'instant', block: 'start' });

  jump();
  setTimeout(jump, 300);   // 补偿第一批懒加载图片
  setTimeout(jump, 900);   // 布局完全稳定后的最终校正
}
