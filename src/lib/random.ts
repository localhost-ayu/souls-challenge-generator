import { seedKeyFromNumber } from "@/engine";

/** Fresh entropy for a new seed. The engine itself never reads randomness. */
export function randomSeedKey(): string {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return seedKeyFromNumber(value!);
}
