/**
 * Admin blackout management endpoint.
 * 
 * Allows admins to mark dates as unavailable (blackouts).
 * Blackouts prevent any bookings on those dates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().optional() });

/**
 * GET /api/admin/blackouts
 * 
 * Returns list of all blackout dates.
 */
export async function GET() {
  const list = await prisma.blackout.findMany({ orderBy: { day: 'asc' } });
  return NextResponse.json(list.map(b => ({ day: b.day.toISOString().slice(0,10), reason: b.reason })));
}

/**
 * POST /api/admin/blackouts
 * 
 * Creates a new blackout date.
 * 
 * Request body: { day: "YYYY-MM-DD", reason?: string }
 * 
 * Creates audit log entry for admin tracking.
 */
export async function POST(req: NextRequest) {
  let body: any = null;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await req.json().catch(() => null);
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (form) body = Object.fromEntries(form.entries());
  } else {
    body = await req.json().catch(() => null);
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const created = await prisma.blackout.create({ data: { day: new Date(parsed.data.day), reason: parsed.data.reason } });
    await prisma.auditLog.create({ data: { actor: 'admin', action: 'CREATE_BLACKOUT', entityType: 'Blackout', entityId: created.id, metadata: parsed.data as any } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/blackouts?day=YYYY-MM-DD
 * 
 * Removes a blackout date.
 * 
 * Query params: day (YYYY-MM-DD format)
 * 
 * Creates audit log entry for admin tracking.
 */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const day = url.searchParams.get('day');
  if (!day) return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  const existing = await prisma.blackout.findUnique({ where: { day: new Date(day) } });
  if (!existing) return NextResponse.json({ ok: true });
  await prisma.blackout.delete({ where: { id: existing.id } });
  await prisma.auditLog.create({ data: { actor: 'admin', action: 'DELETE_BLACKOUT', entityType: 'Blackout', entityId: existing.id, metadata: { day } as any } });
  return NextResponse.json({ ok: true });
}


