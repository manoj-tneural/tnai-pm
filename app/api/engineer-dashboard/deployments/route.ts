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
      `SELECT d.id, d.customer_name as title, d.planned_end_date, d.status, 
              p.name as product_name
       FROM deployments d
       JOIN products p ON d.product_id = p.id
       WHERE d.assignee_id = $1 AND d.status != 'completed'
       ORDER BY d.planned_end_date ASC`,
      [userId]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: 'deployment',
      status: row.status,
      planned_end_date: row.planned_end_date,
      product_name: row.product_name,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[Engineer Dashboard] Deployments error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch deployments' }, { status: 500 });
  }
}
