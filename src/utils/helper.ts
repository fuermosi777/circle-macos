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

  return false;
}

export function notEmpty(value: any): boolean {
  return !isEmpty(value);
}
