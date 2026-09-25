/**
 * 分类锚点跳转工具
 *
 * 保留平滑滚动动画，同时修复移动端刷新后定位不准的问题：
 * - smooth 平滑滚动，目标分类标题顶到 Header（h-16 = 64px）下方；
 * - 动画结束后自动校正两次（瞬时、无感），补偿懒加载图片撑开
 *   上方布局造成的位移，最终停在准确位置。
 */

const HEADER_HEIGHT = 64; // sticky Header 固定高度 h-16

export function scrollToCategory(categoryId: string) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  // 滚动容器：内容区 <main>（overflow-y-auto），兜底 document.scrollingElement
  const container = el.closest('main') ?? document.scrollingElement;
  if (!container) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  // 计算目标分类标题顶到 Header 下方所需的滚动位置
  const targetTop = () => {
    const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top - HEADER_HEIGHT;
    return Math.max(0, top);
  };

  // 平滑滚动到目标
  container.scrollTo({ top: targetTop(), behavior: 'smooth' });

  // 动画结束后的瞬时校正（补偿图片懒加载造成的布局位移，视觉无感）
  const correct = () => container.scrollTo({ top: targetTop(), behavior: 'instant' });
  setTimeout(correct, 700);  // 平滑动画完成后校正一次
  setTimeout(correct, 1400); // 布局完全稳定后最终校正
}
