/**
 * 分类锚点跳转工具
 *
 * 修复移动端定位不准的问题：
 * 1. 使用 smooth 平滑跳转；
 * 2. 跳转后延迟重定位两次，补偿懒加载图片撑开上方内容造成的位移
 *    （图片加载完布局稳定后，最终停在准确位置）。
 */
export function scrollToCategory(categoryId: string) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  // 首次：平滑滚动给用户看
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 后面校正用 instant，静默修正布局位移，不触发动画
  const fixPosition = () => el.scrollIntoView({ behavior: 'instant', block: 'start' });
  setTimeout(fixPosition, 300);
  setTimeout(fixPosition, 900);
}
