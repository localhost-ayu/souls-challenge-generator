import type enUS from "./messages/en-US.json";

export type Messages = typeof enUS;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every dot-separated path to a string in the en-US dictionary. */
export type MessageKey = Leaves<Messages>;

export type MessageParams = Record<string, string | number>;

/** Looks up a key and fills `{placeholders}` from params. */
export function translate(
  messages: Messages,
  key: MessageKey,
  params?: MessageParams,
): string {
  let value: unknown = messages;
  for (const segment of key.split(".")) {
    value = (value as Record<string, unknown> | undefined)?.[segment];
  }
  // Keys are type-checked, so this only triggers if a dictionary is broken.
  if (typeof value !== "string") return key;

  return value.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    params?.[name] === undefined ? placeholder : String(params[name]),
  );
}
