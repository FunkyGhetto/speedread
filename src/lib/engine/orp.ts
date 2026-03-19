export function calculateOrpIndex(word: string): number {
  const len = word.length;
  if (len <= 3) return 0;    // 1-3 letters: 1st letter (index 0)
  if (len <= 5) return 1;    // 4-5 letters: 2nd letter (index 1)
  if (len <= 9) return 2;    // 6-9 letters: 3rd letter (index 2)
  return 3;                  // 10+ letters: 4th letter (index 3)
}
