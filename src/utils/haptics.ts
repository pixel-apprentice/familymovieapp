export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const hapticFeedback = {
  light: () => vibrate(10),
  medium: () => vibrate(30),
  heavy: () => vibrate(50),
  success: () => vibrate([10, 50, 20]),
  error: () => vibrate([50, 50, 50]),
};
