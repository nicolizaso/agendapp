import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { startOfWeek, subWeeks, format, isAfter, isSameDay } from 'date-fns';

export function useWeeklyClaimEngine() {
  const { habitClaims } = useStore();

  return useMemo(() => {
    const today = new Date();
    const previousMonday = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const previousMondayStr = format(previousMonday, 'yyyy-MM-dd');
    const claimId = `week_${previousMondayStr}`;

    const hasClaimed = habitClaims.some(claim => claim.id === claimId);

    // Only show if today is Monday or later, which is always true for previous week
    // But we might want to check if the app has been used at all during that week.
    // We'll just show it if there is no claim for the previous week and we are at least on Monday of the current week.
    const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
    const isAtLeastMonday = isAfter(today, currentWeekMonday) || isSameDay(today, currentWeekMonday);

    const hasPendingClaim = isAtLeastMonday && !hasClaimed;

    return {
      hasPendingClaim,
      previousWeekStartDate: previousMondayStr,
      claimId
    };
  }, [habitClaims]);
}