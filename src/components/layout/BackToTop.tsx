import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

// 回到顶部按钮：右下角圆形，外圈随滚动进度填充，点击平滑回到顶部
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setVisible(scrollTop > 300);
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? Math.min(1, scrollTop / max) : 0);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const onClick = () => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  const R = 20;
  const C = 2 * Math.PI * R;

  return (
    <button
      onClick={onClick}
      title="回到顶部"
      aria-label="回到顶部"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 hover:shadow-xl transition-all duration-200"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={R} fill="none" strokeWidth="2.5" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="22" cy="22" r={R} fill="none" strokeWidth="2.5" strokeLinecap="round"
          className="stroke-blue-500 transition-[stroke-dashoffset] duration-150"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <ArrowUp size={18} />
    </button>
  );
}
