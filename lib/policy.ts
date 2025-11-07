import { prisma } from '@/lib/db';

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


