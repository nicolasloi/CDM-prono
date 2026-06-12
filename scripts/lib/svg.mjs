export function scaleY(v, min, max, height) {
  if (max === min) return height / 2;
  return Math.round((1 - (v - min) / (max - min)) * height);
}

// values: number[]; renvoie un attribut `d` (polyligne)
export function linePath(values, { width, height, min, max }) {
  const n = values.length;
  if (n === 0) return '';
  const step = n === 1 ? 0 : width / (n - 1);
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${Math.round(i * step)},${scaleY(v, min, max, height)}`)
    .join(' ');
}
