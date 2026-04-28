import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id, product_id, log_date, yesterday, today, blockers } = await request.json();

    if (!user_id || !product_id || !log_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // UPSERT: Insert if doesn't exist, or update if it does
    const result = await query(
      `INSERT INTO daily_logs (user_id, product_id, log_date, yesterday, today, blockers, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, product_id, log_date) 
       DO UPDATE SET yesterday = $4, today = $5, blockers = $6
       RETURNING *`,
      [user_id, product_id, log_date, yesterday || '', today || '', blockers || '']
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Daily Logs API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create log' }, { status: 500 });
  }
}
