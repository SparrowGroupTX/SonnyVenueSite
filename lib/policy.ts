/**
 * Booking policy management.
 * 
 * Handles retrieval and creation of the default booking policy,
 * which controls deposit calculations, remainder charge timing, and cancellation rules.
 */
import { prisma } from '@/lib/db';

/**
 * Gets the default booking policy, creating it if it doesn't exist.
 * 
 * Policy settings:
 * - depositType: 'FIXED' (fixed amount) or 'PERCENT' (percentage of total)
 * - depositValue: Deposit amount in cents (if FIXED) or percentage (if PERCENT)
 * - remainderDaysBeforeStart: Days before booking start to charge remainder (default: 14)
 * - cancelCutoffHours: Hours before start when cancellation window closes (default: 48)
 * 
 * @returns The default Policy record
 */
export async function getOrCreateDefaultPolicy() {
  const existing = await prisma.policy.findUnique({ where: { id: 'default' } });
  if (existing) return existing;
  return prisma.policy.create({
    data: {
      id: 'default',
      depositType: 'FIXED',
      depositValue: Number(process.env.DEPOSIT_CENTS || 20000), // $200 default
      remainderDaysBeforeStart: Number(process.env.REMAINDER_DAYS || 14),
      cancelCutoffHours: Number(process.env.CANCEL_CUTOFF_HOURS || 48),
    },
  });
}


