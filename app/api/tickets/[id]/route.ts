import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates = await request.json();
    const { id } = params;

    // Get current ticket data for logging changes
    const currentResult = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const currentTicket = currentResult.rows[0];

    // Get user ID from token (basic extraction)
    let userId = null;
    try {
      // Simple extraction of user info from token if available
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decode the payload (second part)
        const decoded = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        userId = decoded.userId || decoded.sub;
      }
    } catch (e) {
      console.error('Token decode error:', e);
      // If token decode fails, we'll continue without user ID
    }

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

    // Log changes to ticket_history (wrapped in try-catch to not break the update)
    if (userId) {
      try {
        for (const field of fields) {
          const oldValue = currentTicket[field];
          const newValue = updates[field];

          // Only log if value actually changed
          if (oldValue !== newValue) {
            await query(
              `INSERT INTO ticket_history (ticket_id, user_id, action, field_name, old_value, new_value, description)
               VALUES ($1, $2, 'updated', $3, $4, $5, $6)`,
              [id, userId, field, String(oldValue || ''), String(newValue || ''), `${field} changed from "${oldValue}" to "${newValue}"`]
            );
          }
        }
      } catch (historyErr) {
        console.error('[Tickets API] Failed to log history:', historyErr);
        // Don't fail the main update if history logging fails
      }
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
