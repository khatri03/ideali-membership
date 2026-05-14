export function cn(
  ...classes: Array<
    string | false | null | undefined | Record<string, boolean | undefined>
  >
) {
  return classes
    .flatMap((value) => {
      if (typeof value === "string") {
        return [value];
      }

      if (value && typeof value === "object") {
        return Object.entries(value)
          .filter(([, enabled]) => Boolean(enabled))
          .map(([className]) => className);
      }

      return [];
    })
    .join(" ");
}
