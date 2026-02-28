export function riskColor(score: number) {
  if (score > 70) return "text-accent-rose";
  if (score > 30) return "text-accent-amber";
  return "text-accent-emerald";
}

export function riskLabel(score: number) {
  if (score > 70) return "High";
  if (score > 30) return "Moderate";
  return "Low";
}
