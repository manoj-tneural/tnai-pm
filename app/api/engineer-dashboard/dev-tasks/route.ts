import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const result = await query(
      `SELECT dti.id, dti.title, dti.planned_start_date, dti.planned_end_date, dti.status, 
              dt.product_id, p.name as product_name
       FROM dev_task_items dti
       JOIN dev_tasks dt ON dti.task_id = dt.id
       JOIN products p ON dt.product_id = p.id
       WHERE dti.assignee_id = $1 AND dti.status != 'done'
       ORDER BY dti.planned_end_date ASC`,
      [userId]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: 'dev-task',
      status: row.status,
      planned_end_date: row.planned_end_date,
      product_name: row.product_name,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[Engineer Dashboard] Dev Tasks error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch dev tasks' }, { status: 500 });
  }
}
