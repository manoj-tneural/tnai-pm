import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('[History API] GET - Fetching history for ticket:', params.id);
    const result = await query(
      `SELECT th.*, p.full_name, p.role
       FROM ticket_history th
       LEFT JOIN profiles p ON th.user_id = p.id
       WHERE th.ticket_id = $1
       ORDER BY th.created_at DESC`,
      [params.id]
    );

    console.log('[History API] GET - Found', result.rows.length, 'history entries');
    return NextResponse.json({ history: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Ticket History API] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch history';
    return NextResponse.json({ error: errorMessage, details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { user_id, action, field_name, old_value, new_value, description } = body;

    const result = await query(
      `INSERT INTO ticket_history (ticket_id, user_id, action, field_name, old_value, new_value, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [params.id, user_id, action, field_name, old_value, new_value, description]
    );

    return NextResponse.json({ history: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Ticket History API] POST error:', error);
    return NextResponse.json({ error: 'Failed to log history' }, { status: 500 });
  }
}
