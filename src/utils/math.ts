export const median = (arr: number[]) => {
  if (!arr.length) return undefined;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export const average = (array: number[]) =>
  array.reduce((a, b) => a + b) / array.length;
