import { NextResponse } from 'next/server';

// Health check pour load balancers et monitoring uptime.
// Sciemment SANS check DB pour éviter qu'un Postgres lent fasse échouer
// le health check (cf. /api/ready pour le readiness check qui inclut la DB).
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'flex',
    version: process.env.APP_VERSION ?? 'dev',
    timestamp: new Date().toISOString(),
  });
}
