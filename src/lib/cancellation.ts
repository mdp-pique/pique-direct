// Hospitable Direct's cancellation policy, as its checkout shows it (read 11-25;
// the same on Edmonton and Canmore homes):
//   - full refund if cancelled within 24 hours of booking, unless check-in is
//     within 7 days of the booking;
//   - full refund up to 30 days before check-in;
//   - 50% of the nightly rate, fees and taxes up to 7 days before check-in;
//   - no refund after that.
// If it's changed in Hospitable, change it here and on the cancellation page.
export const CANCELLATION = { fullDays: 30, halfDays: 7, graceHours: 24 };

const DAY = 86_400_000;
const fmt = (d: Date) => d.toLocaleDateString("en-CA", { month: "long", day: "numeric", timeZone: "UTC" });

// One line for beside Book now, for a stay checking in on `checkin` booked today.
export function cancellationLine(checkin: string, today = new Date()): string {
  const ci = Date.parse(`${checkin}T00:00:00Z`);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysOut = Math.round((ci - now) / DAY);
  if (daysOut >= CANCELLATION.fullDays) return `Free cancellation until ${fmt(new Date(ci - CANCELLATION.fullDays * DAY))}.`;
  if (daysOut >= CANCELLATION.halfDays)
    return `Full refund if you cancel within 24 hours of booking; 50% back until ${fmt(new Date(ci - CANCELLATION.halfDays * DAY))}.`;
  return "Check-in is within 7 days, so this booking can't be refunded.";
}
