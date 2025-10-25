// super tiny deterministic fake embedding generator
// input text -> array of numbers for similarity scoring later
export function embedText(input: string): number[] {
  // hash-ish fake embedding: turn chars into numbers, bucket them
  const buckets = new Array(8).fill(0); // 8-dim "vector"
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    buckets[i % buckets.length] += code;
  }
  // normalize-ish
  const magnitude = Math.sqrt(buckets.reduce((sum, val) => sum + val * val, 0));
  return magnitude === 0 ? buckets : buckets.map((v) => v / magnitude);
}
