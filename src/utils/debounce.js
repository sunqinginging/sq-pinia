export function debounce(fn, delay, immediate) {
  let timer = null;
  let isInvoke = false;

  const _debounce = function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate && !isInvoke) {
      fn.apply(this, args);
      isInvoke = true;
    }

    timer = setTimeout(() => {
      fn.apply(this, args);
      // 延迟执行之后 也需要将isInvoke设置为false 保证过段时间 被触发的时候也能立即先触发一次
      isInvoke = false;
    }, delay);
  };

  _debounce.cancel = () => {
    if (timer) {
      clearTimeout(timer);
    }
    // 其他的初始化设置
    timer = null;
    isInvoke = false;
  };

  return _debounce;
}
