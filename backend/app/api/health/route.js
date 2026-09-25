import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// mysql2 requires the Node.js runtime. Node.js is the default runtime for
// Route Handlers, but keeping this explicit makes the dependency clear.
export const runtime = 'nodejs';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 AS database_connected');
    const databaseConnected = rows?.[0]?.database_connected === 1;

    return NextResponse.json({
      success: databaseConnected,
      message: databaseConnected
        ? 'EventoPlanners API is running'
        : 'EventoPlanners API is running, but the database health check failed',
      database: databaseConnected,
    });
  } catch (error) {
    console.error('EventoPlanners database health check failed:', error);

    // A 503 correctly reports that the API process is reachable but one of its
    // required services (MySQL) is unavailable. The frontend now distinguishes
    // this response from a true network/backend connection failure.
    return NextResponse.json(
      {
        success: false,
        message: 'EventoPlanners API is running, but the database connection failed',
        database: false,
      },
      { status: 503 },
    );
  }
}
