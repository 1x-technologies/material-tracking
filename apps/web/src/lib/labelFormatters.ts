export function pieceFraction(pieceNumber: number, pieceCount: number): string {
  return `${pieceNumber}/${pieceCount}`;
}

export function truncateDescription(
  description: string,
  maxLength = 60,
): string {
  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength - 1)}…`;
}
