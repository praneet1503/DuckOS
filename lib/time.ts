/**
 * Reusable time engine for DuckOS.
 *
 * Fully client-side — uses `Date` and `Intl.DateTimeFormat` only.
 * No external APIs, no IP detection, no geolocation.
 */

/** Returns the current `Date`. */
export function getNow(): Date {
  return new Date();
}

/** Returns the user's IANA timezone string (e.g. "America/New_York"). */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Formats a `Date` as a time string.
 *
 * Default: `HH:MM:SS` (24-hour, 2-digit hour/min/sec).
 *
 * Pass a `timeZone` in `options` to display time for a different zone.
 */
export function formatTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaults: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return new Intl.DateTimeFormat(undefined, { ...defaults, ...options }).format(
    date,
  );
}

/**
 * Formats a `Date` as a human-readable date string.
 *
 * Output includes weekday, month, day, and year.
 * Example: "Thursday, February 26, 2026"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
