// calendar utils for calendar app
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
export function generateCalendarGrid(
  year: number,
  month: number,
): (Date | null)[] {
  const totalDays = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const grid: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    grid.push(new Date(year, month, d));
  }
  while (grid.length < 42) {
    grid.push(null);
  }

  return grid;
}

//all cleared//