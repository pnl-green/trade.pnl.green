export const isSafari =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const isIOS =
  typeof navigator !== 'undefined' &&
  /iP(ad|hone|od)/i.test(navigator.userAgent);
