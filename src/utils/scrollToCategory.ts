/**
 * 分类锚点跳转工具
 *
 * 修复移动端定位不准的问题：
 * 1. 使用 smooth 平滑跳转；
 * 2. 跳转后延迟重定位两次，补偿懒加载图片撑开上方内容造成的位移
 *    （图片加载完布局稳定后，最终停在准确位置）。
 *
 * @param toTop 点击"第一个分类"时传 true：直接滚回页面最顶端。
 *  原因：页面最上方可能有"置顶网站"区块，若仍按 scrollIntoView + scroll-margin
 *  （scroll-mt-20 = 80px）对齐，第一个分类会停在距顶 80px 处，置顶区块被裁掉一半，
 *  用户还需手动再滑一下才能到顶。
 */
export function scrollToCategory(categoryId: string, toTop = false) {
  const el = document.getElementById(`cat-${categoryId}`);
  if (!el) return;

  // 找到实际滚动容器（本项目布局中 main 是 overflow-y-auto 的滚动容器）
  const getContainer = (): HTMLElement | Window => {
    const main = document.querySelector('main');
    if (main) {
      const style = getComputedStyle(main);
      if (/(auto|scroll|overlay)/.test(style.overflowY)) return main;
    }
    return window;
  };

  const jump = () => {
    if (toTop) {
      getContainer().scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  jump();
  setTimeout(jump, 300);   // 补偿第一批懒加载图片
  setTimeout(jump, 900);   // 布局完全稳定后的最终校正
}
