/**
 * 分类锚点跳转工具
 */
export function scrollToCategory(categoryId: string, options?: { delay?: number }) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  const delay = options?.delay ?? 0;

  const doScroll = () => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (delay > 0) {
    setTimeout(doScroll, delay);
  } else {
    doScroll();
  }
}
