/**
 * Calendar utility engine for DuckOS.
 *
 * Fully client-side — pure JS `Date` API only.
 * No external libraries.
 */

/** Returns the number of days in a given month (0-based). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the day-of-week index (0 = Sunday … 6 = Saturday)
 * for the 1st of the given month.
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Generates a 42-cell calendar grid (6 rows × 7 columns).
 *
 * Cells that don't belong to the current month are `null`.
 * Week starts on Sunday.
 */
export function generateCalendarGrid(
  year: number,
  month: number,
): (Date | null)[] {
  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const grid: (Date | null)[] = [];

  // Leading nulls (days before the 1st)
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    grid.push(new Date(year, month, d));
  }

  // Trailing nulls to fill 42 cells
  while (grid.length < 42) {
    grid.push(null);
  }

  return grid;
}
