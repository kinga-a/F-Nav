/**
 * 滚动到对应分类区块
 * @param element 分类DOM元素
 * @param toTop 是否直接滚到容器顶部（用于第一个分类，保留置顶区域）
 */
export function scrollToCategory(element: HTMLElement | null, toTop = false) {
  if (!element) return;

  const scrollContainer = document.querySelector<HTMLElement>('main.flex-1.overflow-y-auto');
  if (!scrollContainer) return;

  // 第一个分类：直接滚动容器到顶部
  if (toTop) {
    scrollContainer.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    return;
  }

  // 其他分类保持原有锚点逻辑
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  // 原有补偿逻辑，防止图片加载导致位置偏移
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 300);

  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 900);
}
