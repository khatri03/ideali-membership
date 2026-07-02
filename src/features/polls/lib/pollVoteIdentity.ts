const ANONYMOUS_POLL_VOTE_KEY_PREFIX = "ideali-membership.poll-vote";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getOrCreateAnonymousPollVoteKey(pollUniqueId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = `${ANONYMOUS_POLL_VOTE_KEY_PREFIX}:${pollUniqueId}`;
  const existingKey = window.localStorage.getItem(storageKey);
  if (existingKey) {
    return existingKey;
  }

  const nextKey = createId();
  window.localStorage.setItem(storageKey, nextKey);
  return nextKey;
}
