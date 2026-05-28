import { useEffect, useRef } from 'react';

/**
 * useDebouncedEffect
 * 在依賴變動後延遲 delay 毫秒才執行 effect，常用於降低 localStorage 寫入頻率。
 *
 * @param {Function} effect    要延遲執行的副作用（不接受清除函式）
 * @param {Array} deps         依賴陣列
 * @param {number} delay       延遲毫秒數，預設 500
 */
export function useDebouncedEffect(effect, deps, delay = 500) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      effect();
      timerRef.current = null;
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
