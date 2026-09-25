/**
 * 分类锚点跳转工具
 *
 * 策略：
 * 1. 首次使用 smooth 平滑滚动，提供流畅体验；
 * 2. 延迟后用 instant 精确校正，补偿懒加载图片撑开上方内容造成的位移；
 * 3. 支持 delay 参数，等待布局稳定（如侧边栏关闭动画）后再执行滚动。
 */
export function scrollToCategory(categoryId: string, options?: { delay?: number }) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  const delay = options?.delay ?? 0;

  const doScroll = () => {
    // 首次：平滑滚动
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 补偿：用 instant 精确校正（懒加载图片撑开内容后）
    const fix = () => {
      const rect = el.getBoundingClientRect();
      const targetTop = rect.top + window.scrollY;
      const diff = Math.abs(targetTop - window.scrollY);
      // 偏差小于 2px 就不动了，避免无意义微跳
      if (diff < 2) return;
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    };

    setTimeout(fix, 400);   // 补偿第一批懒加载图片
    setTimeout(fix, 1000);  // 布局完全稳定后的最终校正
  };

  if (delay > 0) {
    setTimeout(doScroll, delay);
  } else {
    doScroll();
  }
}
