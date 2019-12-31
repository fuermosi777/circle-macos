function throttle(fn: (A?: any) => void) {
  let tick = false;

  return (...args: any) => {
    if (!tick) {
      window.requestAnimationFrame(() => {
        fn(...args);
        tick = false;
      });
      tick = true;
    }
  };
}

export { throttle };
