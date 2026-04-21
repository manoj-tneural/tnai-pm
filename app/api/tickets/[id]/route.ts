import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates = await request.json();
    const { id } = params;

    // Filter out protected fields
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'reporter_id' && k !== 'created_at');
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => updates[f]);

    const result = await query(
      `UPDATE tickets SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('[Tickets API] PATCH error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update ticket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    // Delete associated comments first
    await query('DELETE FROM ticket_comments WHERE ticket_id = $1', [id]);

    // Delete the ticket
    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Tickets API] DELETE error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete ticket' }, { status: 500 });
  }
}
