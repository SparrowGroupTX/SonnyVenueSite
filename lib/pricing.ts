import { enumerateDates } from '@/lib/time';

export function dayPriceCents(): number {
  return Number(process.env.DAY_PRICE_CENTS || 50000); // $500/day default
}

export function quoteRange(startDate: string, endDateExclusive: string) {
  const days = enumerateDates(startDate, endDateExclusive).length;
  const perDay = dayPriceCents();
  const total = days * perDay;
  return { days, perDay, total };
}

export function computeDeposit(total: number, depositType: 'FIXED' | 'PERCENT', value: number) {
  if (depositType === 'FIXED') return Math.min(value, total);
  const pct = Math.round((total * value) / 100);
  return Math.min(pct, total);
}


