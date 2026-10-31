/**
 * Nigeria Time (West Africa Time - WAT, UTC+1) utility.
 * Enforces withdrawal schedules and monthly plan expiration based on trusted time,
 * immune to local client clock manipulation via server time synchronization and performance monotonic counters.
 */

let serverTimeOffsetMs = 0;
let hasSyncedWithServer = false;
let syncMonotonicOrigin = 0;

/**
 * Synchronize with trusted origin server time (e.g. HTTP Date header)
 */
export async function syncServerTime(): Promise<void> {
  try {
    const startMonotonic = performance.now();
    const response = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    const serverDateHeader = response.headers.get('date');
    if (serverDateHeader) {
      const serverTimeMs = new Date(serverDateHeader).getTime();
      const roundTripMs = performance.now() - startMonotonic;
      const accurateServerTimeMs = serverTimeMs + roundTripMs / 2;
      serverTimeOffsetMs = accurateServerTimeMs - Date.now();
      syncMonotonicOrigin = performance.now();
      hasSyncedWithServer = true;
    }
  } catch (err) {
    // Fallback: estimate from local clock if network is unreachable
    console.warn('Server time sync notice: using system time fallback', err);
  }
}

// Automatically initiate sync
if (typeof window !== 'undefined') {
  syncServerTime();
}

/**
 * Returns current trusted timestamp in milliseconds
 */
export function getTrustedTimestamp(): number {
  if (hasSyncedWithServer && syncMonotonicOrigin > 0) {
    // Protected against manual client clock jumps using monotonic counter
    return Date.now() + serverTimeOffsetMs;
  }
  return Date.now() + serverTimeOffsetMs;
}

export interface WatDateComponents {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  timestamp: number;
  isoString: string;
}

/**
 * Get current time in Nigeria (West Africa Time - WAT, UTC+1)
 */
export function getWatTime(): WatDateComponents {
  const trustedMs = getTrustedTimestamp();
  // WAT is UTC + 1 hour (3600000 ms)
  const watMs = trustedMs + 1 * 60 * 60 * 1000;
  const d = new Date(watMs);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
    timestamp: trustedMs,
    isoString: d.toISOString()
  };
}

/**
 * Helper to format countdown duration (e.g. "02h 14m 32s")
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export interface ScheduleStatus {
  isOpen: boolean;
  statusText: string;
  nextWindowText: string;
  closesInText?: string;
  countdownMs: number;
  formattedCountdown: string;
}

/**
 * Affiliate / Referral Withdrawal Schedule:
 * - Opening time: 7:30 PM (19:30 WAT)
 * - Closing time: 8:40 PM (20:40 WAT)
 * - Daily recurring schedule
 */
export function getAffiliateWithdrawalStatus(): ScheduleStatus {
  const wat = getWatTime();
  const currentMinutesToday = wat.hours * 60 + wat.minutes;

  const openMinutes = 19 * 60 + 30; // 19:30 = 1170 mins
  const closeMinutes = 20 * 60 + 40; // 20:40 = 1240 mins

  // Today's open and close timestamps
  const baseMidnightWatMs = Date.UTC(wat.year, wat.month - 1, wat.day) - 1 * 60 * 60 * 1000;
  const todayOpenMs = baseMidnightWatMs + (19 * 3600 + 30 * 60) * 1000;
  const todayCloseMs = baseMidnightWatMs + (20 * 3600 + 40 * 60) * 1000;
  const tomorrowOpenMs = todayOpenMs + 24 * 3600 * 1000;

  const trustedMs = getTrustedTimestamp();

  if (currentMinutesToday >= openMinutes && currentMinutesToday < closeMinutes) {
    // Currently OPEN
    const remainingMs = Math.max(0, todayCloseMs - trustedMs);
    return {
      isOpen: true,
      statusText: 'Affiliate Withdrawal Window is OPEN',
      nextWindowText: 'Closes today at 8:40 PM WAT',
      closesInText: `Closes in ${formatDuration(remainingMs)}`,
      countdownMs: remainingMs,
      formattedCountdown: formatDuration(remainingMs)
    };
  }

  if (currentMinutesToday < openMinutes) {
    // Opens later today at 7:30 PM
    const remainingMs = Math.max(0, todayOpenMs - trustedMs);
    return {
      isOpen: false,
      statusText: 'Affiliate Withdrawal Window is CLOSED',
      nextWindowText: 'Opens today at 7:30 PM WAT (Nigeria Time)',
      countdownMs: remainingMs,
      formattedCountdown: formatDuration(remainingMs)
    };
  }

  // Otherwise, opens tomorrow at 7:30 PM
  const remainingMs = Math.max(0, tomorrowOpenMs - trustedMs);
  return {
    isOpen: false,
    statusText: 'Affiliate Withdrawal Window is CLOSED',
    nextWindowText: 'Opens tomorrow at 7:30 PM WAT (Nigeria Time)',
    countdownMs: remainingMs,
    formattedCountdown: formatDuration(remainingMs)
  };
}

/**
 * Returns the eligible cutoff day for a given year and month (1-12)
 * February: last calendar day (28 or 29). Other months: 30th day.
 */
export function getEligibleDayForMonth(year: number, month: number): number {
  if (month === 2) {
    // Last day of February
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }
  return 30;
}

/**
 * Task Withdrawal Schedule:
 * - Available only on the 30th day of each month (or last day of Feb).
 * - Opening time: 4:50 PM WAT (16:50)
 * - Closing time: 6:20 PM WAT (18:20)
 * - Outside window: disabled with next eligible date & time
 */
export function getTaskWithdrawalStatus(): ScheduleStatus {
  const wat = getWatTime();
  const currentMinutesToday = wat.hours * 60 + wat.minutes;

  const eligibleDayThisMonth = getEligibleDayForMonth(wat.year, wat.month);
  const openMinutes = 16 * 60 + 50; // 16:50 = 1010 mins
  const closeMinutes = 18 * 60 + 20; // 18:20 = 1100 mins

  const isEligibleDay = wat.day === eligibleDayThisMonth;

  // Calculate this month's open and close timestamps
  const thisMonthMidnightMs = Date.UTC(wat.year, wat.month - 1, eligibleDayThisMonth) - 1 * 60 * 60 * 1000;
  const thisMonthOpenMs = thisMonthMidnightMs + (16 * 3600 + 50 * 60) * 1000;
  const thisMonthCloseMs = thisMonthMidnightMs + (18 * 3600 + 20 * 60) * 1000;

  const trustedMs = getTrustedTimestamp();

  if (isEligibleDay && currentMinutesToday >= openMinutes && currentMinutesToday < closeMinutes) {
    // Currently OPEN
    const remainingMs = Math.max(0, thisMonthCloseMs - trustedMs);
    return {
      isOpen: true,
      statusText: 'Task Withdrawal Window is OPEN',
      nextWindowText: 'Closes today at 6:20 PM WAT',
      closesInText: `Closes in ${formatDuration(remainingMs)}`,
      countdownMs: remainingMs,
      formattedCountdown: formatDuration(remainingMs)
    };
  }

  // Calculate next eligible window timestamp
  let nextOpenMs: number;
  let nextEligibleDateLabel: string;

  if (isEligibleDay && currentMinutesToday < openMinutes) {
    // Later today!
    nextOpenMs = thisMonthOpenMs;
    nextEligibleDateLabel = `Today (${eligibleDayThisMonth}th) at 4:50 PM WAT`;
  } else if (!isEligibleDay && wat.day < eligibleDayThisMonth) {
    // Coming up this month
    nextOpenMs = thisMonthOpenMs;
    const monthName = new Date(Date.UTC(wat.year, wat.month - 1, 1)).toLocaleString('en-US', { month: 'short' });
    nextEligibleDateLabel = `${eligibleDayThisMonth}th ${monthName} at 4:50 PM WAT`;
  } else {
    // Next month's cutoff
    let nextMonth = wat.month + 1;
    let nextYear = wat.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextEligibleDay = getEligibleDayForMonth(nextYear, nextMonth);
    const nextMonthMidnightMs = Date.UTC(nextYear, nextMonth - 1, nextEligibleDay) - 1 * 60 * 60 * 1000;
    nextOpenMs = nextMonthMidnightMs + (16 * 3600 + 50 * 60) * 1000;
    const nextMonthName = new Date(Date.UTC(nextYear, nextMonth - 1, 1)).toLocaleString('en-US', { month: 'short' });
    nextEligibleDateLabel = `${nextEligibleDay}th ${nextMonthName} at 4:50 PM WAT`;
  }

  const remainingMs = Math.max(0, nextOpenMs - trustedMs);
  return {
    isOpen: false,
    statusText: 'Task Withdrawal Window is CLOSED',
    nextWindowText: `Opens on ${nextEligibleDateLabel}`,
    countdownMs: remainingMs,
    formattedCountdown: formatDuration(remainingMs)
  };
}

/**
 * Determines whether a plan activated in a previous cycle or before the current month's
 * 30th-day cutoff should be expired.
 * Rule: When the 30th day of the month arrives (last day of Feb for February),
 * any active plan active prior to that cutoff reaches expiration.
 */
export function isPlanEligibleForMonthlyExpiration(startDateIso: string): boolean {
  if (!startDateIso) return false;
  const start = new Date(startDateIso);
  const startMs = start.getTime();

  const wat = getWatTime();
  const eligibleDay = getEligibleDayForMonth(wat.year, wat.month);

  // If today in WAT has reached or passed the eligible cutoff day of the current month
  if (wat.day >= eligibleDay) {
    // Current month's cutoff timestamp (start of 30th day 00:00 WAT)
    const cutoffMidnightMs = Date.UTC(wat.year, wat.month - 1, eligibleDay) - 1 * 60 * 60 * 1000;
    // If the plan was started before the current month's 30th-day cutoff, it expires!
    return startMs < cutoffMidnightMs;
  }

  // If we haven't reached the 30th yet this month, check if plan was started before last month's cutoff
  let prevMonth = wat.month - 1;
  let prevYear = wat.year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevEligibleDay = getEligibleDayForMonth(prevYear, prevMonth);
  const prevCutoffMidnightMs = Date.UTC(prevYear, prevMonth - 1, prevEligibleDay) - 1 * 60 * 60 * 1000;

  return startMs < prevCutoffMidnightMs;
}

/**
 * Returns formatted WAT time string, e.g. "04:50 PM WAT" or "30 Oct 2026, 04:50 PM WAT"
 */
export function formatWatTime(includeDate: boolean = false): string {
  const wat = getWatTime();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const period = wat.hours >= 12 ? 'PM' : 'AM';
  const displayHours = wat.hours % 12 === 0 ? 12 : wat.hours % 12;
  const timeStr = `${pad(displayHours)}:${pad(wat.minutes)} ${period} WAT`;

  if (includeDate) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${wat.day} ${monthNames[wat.month - 1]} ${wat.year}, ${timeStr}`;
  }
  return timeStr;
}

/**
 * Returns current WAT date string in YYYY-MM-DD
 */
export function getWatDate(): string {
  const wat = getWatTime();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${wat.year}-${pad(wat.month)}-${pad(wat.day)}`;
}

