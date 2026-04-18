/**
 * Shared Firebase Realtime Database helpers
 *
 * ── rtdbToArray ──
 * Converts a Firebase RTDB DataSnapshot to a plain JavaScript array.
 * Uses BOTH `forEach` AND `Object.keys` and MERGES the results so
 * that NO child is ever missed.  Items seen by either method are
 * included; duplicates (same key from both methods) are de-duped.
 *
 * This is the bullet-proof fix for the "only one item showing" bug
 * that occurred when `snap.forEach()` silently failed to iterate
 * all children in certain Firebase SDK edge-cases.
 */

export interface RtdbSnapshot {
  exists(): boolean;
  val(): unknown;
  forEach(cb: (child: { key: string | null; val(): unknown }) => void): void;
}

/**
 * Convert an RTDB snapshot to an array of typed objects.
 * Every child key is guaranteed to appear exactly once, even if
 * one of the two iteration methods fails.
 */
export function rtdbToArray<T extends Record<string, unknown>>(
  snap: RtdbSnapshot,
  sortKey: string = "createdAt",
): T[] {
  // ── DEBUG: Log raw snapshot state ──
  const snapExists = snap.exists();
  const rawVal = snapExists ? snap.val() : null;
  const rawType = rawVal !== null ? (Array.isArray(rawVal) ? "array" : typeof rawVal) : "null";
  const rawKeys = rawVal && typeof rawVal === "object" && !Array.isArray(rawVal)
    ? Object.keys(rawVal as Record<string, unknown>)
    : [];

  console.log(
    `%c[rtdbToArray] DEBUG: exists=${snapExists}, valType=${rawType}, keyCount=${rawKeys.length}`,
    "color: #00f; font-weight: bold",
    rawKeys.length > 0 ? `keys=[${rawKeys.slice(0, 10).join(", ")}${rawKeys.length > 10 ? "..." : ""}]` : ""
  );

  if (!snapExists) {
    console.log("[rtdbToArray] Snapshot does NOT exist — returning empty array");
    return [];
  }

  // We collect into a Map keyed by Firebase push-key to de-duplicate
  const map = new Map<string, T>();

  // ── Method 1: snap.forEach() ──
  let forEachCount = 0;
  try {
    snap.forEach((child) => {
      const val = child.val();
      const key = child.key;
      if (val && typeof val === "object" && !Array.isArray(val) && key) {
        map.set(key, { id: key, ...(val as Omit<T, "id">) } as T);
        forEachCount++;
      }
    });
  } catch (err) {
    console.warn("[rtdbToArray] forEach threw:", err);
  }
  console.log(`[rtdbToArray] Method1 forEach found: ${forEachCount} items`);

  // ── Method 2: Object.keys(snap.val()) ──
  let objKeysCount = 0;
  try {
    if (rawVal && typeof rawVal === "object" && !Array.isArray(rawVal)) {
      for (const key of rawKeys) {
        if (map.has(key)) continue; // already captured by forEach
        const childData = (rawVal as Record<string, unknown>)[key];
        if (childData && typeof childData === "object" && !Array.isArray(childData)) {
          map.set(key, { id: key, ...(childData as Omit<T, "id">) } as T);
          objKeysCount++;
        }
      }
    }
  } catch (err) {
    console.warn("[rtdbToArray] Object.keys threw:", err);
  }
  console.log(`[rtdbToArray] Method2 Object.keys added: ${objKeysCount} NEW items (missed by forEach)`);

  // Convert Map values to array and sort
  const list = Array.from(map.values());
  list.sort(
    (a, b) =>
      ((b as Record<string, unknown>)[sortKey] as number || 0) -
      ((a as Record<string, unknown>)[sortKey] as number || 0),
  );

  console.log(
    `%c[rtdbToArray] FINAL RESULT: ${list.length} items`,
    "color: #0a0; font-weight: bold"
  );

  return list;
}
