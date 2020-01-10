export function isEmpty(value: any): boolean {
  if (typeof value === 'undefined') {
    return true;
  }
  if (value === null) {
    return true;
  }

  if (value === '') {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  return false;
}

export function notEmpty(value: any): boolean {
  return !isEmpty(value);
}


export function debounce<T extends Function>(cb: T, wait = 20) {
  let h: any = 0;
  let callable = (...args: any) => {
      clearTimeout(h);
      h = setTimeout(() => cb(...args), wait);
  };
  return <T>(<any>callable);
}

export function throttle<T extends Function>(cb: T, limit = 60): Function {
	let inThrottle: boolean;

	return function(this: any): any {
		const args = arguments;
		const context = this;

		if (!inThrottle) {
			inThrottle = true;
			cb.apply(context, args);
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

export function isNearBottom(t: HTMLDivElement, perToBottom = 0.2) {
  return t.scrollTop > (t.scrollHeight - t.offsetHeight) * (1 - perToBottom);
}

export function isNearTop(t: HTMLDivElement, perToTop = 0.2) {
  return t.scrollTop < (t.scrollHeight - t.offsetHeight) * perToTop;
}