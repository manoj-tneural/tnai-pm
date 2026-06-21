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
      `SELECT t.id, t.title, t.status, t.priority, t.ticket_number,
              p.name as product_name
       FROM tickets t
       LEFT JOIN products p ON t.product_id = p.id
       WHERE t.assignee_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      title: `#${row.ticket_number}: ${row.title}`,
      type: 'ticket',
      status: row.status,
      priority: row.priority,
      product_name: row.product_name,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[Engineer Dashboard] Tickets error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch tickets' }, { status: 500 });
  }
}
