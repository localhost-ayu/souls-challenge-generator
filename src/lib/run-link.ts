export function runPath(seed: string): string {
  return `/run?seed=${encodeURIComponent(seed)}`;
}

export function runUrl(seed: string): string {
  return new URL(runPath(seed), window.location.origin).toString();
}
