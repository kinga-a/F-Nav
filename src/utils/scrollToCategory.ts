export function scrollToCategory(categoryId: string, options?: { delay?: number }) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  const delay = options?.delay ?? 0;

  const doScroll = () => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 仅当偏差超过 80px 时才补偿（说明有大量图片撑开了布局）
    // 且用 smooth，用户感知为"继续滑了一小段"而非"跳了一下"
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const offset = rect.top;
      if (Math.abs(offset) > 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 1200);
  };

  if (delay > 0) {
    setTimeout(doScroll, delay);
  } else {
    doScroll();
  }
}
