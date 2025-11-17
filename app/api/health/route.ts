/**
 * Health check endpoint.
 * 
 * Simple endpoint to verify the API is running.
 * Useful for monitoring and load balancer health checks.
 */
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 
 * Returns a simple health status with current timestamp.
 */
export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}


