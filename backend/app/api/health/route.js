import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT 1 AS database_connected');

    return NextResponse.json({
      success: true,
      message: 'EventoPlanners API is running',
      database: rows[0].database_connected === 1,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
      },
      {
        status: 500,
      }
    );
  }
}