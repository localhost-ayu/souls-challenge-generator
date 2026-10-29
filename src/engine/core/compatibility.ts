import type { ConstraintDefinition } from "./types";

type ConstraintRules = Pick<
  ConstraintDefinition<unknown>,
  "id" | "exclusiveGroup" | "conflictsWith" | "requires"
>;

/** Conflicts count in both directions, so declaring them on one side is enough. */
export function conflicts(a: ConstraintRules, b: ConstraintRules): boolean {
  return (
    (a.conflictsWith?.includes(b.id) ?? false) ||
    (b.conflictsWith?.includes(a.id) ?? false)
  );
}

/**
 * A set is compatible when no two constraints conflict, no exclusive group
 * is used twice and every requirement is part of the set.
 */
export function isCompatible(selected: readonly ConstraintRules[]): boolean {
  const ids = new Set(selected.map((c) => c.id));
  if (ids.size !== selected.length) return false;

  const groups = new Set<string>();
  for (const [index, constraint] of selected.entries()) {
    if (constraint.exclusiveGroup !== undefined) {
      if (groups.has(constraint.exclusiveGroup)) return false;
      groups.add(constraint.exclusiveGroup);
    }
    if (constraint.requires?.some((id) => !ids.has(id))) return false;
    if (selected.slice(index + 1).some((other) => conflicts(constraint, other))) {
      return false;
    }
  }
  return true;
}
