import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Extract user ID from token
    let userId = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        userId = decoded.userId || decoded.sub;
      }
    } catch (e) {
      console.error('Token decode error:', e);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify ownership
    const noteResult = await query(
      'SELECT user_id FROM ticket_work_notes WHERE id = $1 AND ticket_id = $2',
      [params.noteId, params.id]
    );

    if (noteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Work note not found' }, { status: 404 });
    }

    if (noteResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { work_note } = await request.json();

    if (!work_note || !work_note.trim()) {
      return NextResponse.json({ error: 'Work note cannot be empty' }, { status: 400 });
    }

    const result = await query(
      `UPDATE ticket_work_notes SET work_note = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [work_note, params.noteId]
    );

    return NextResponse.json({ workNote: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('[Work Notes API] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update work note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Extract user ID from token
    let userId = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        userId = decoded.userId || decoded.sub;
      }
    } catch (e) {
      console.error('Token decode error:', e);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify ownership
    const noteResult = await query(
      'SELECT user_id FROM ticket_work_notes WHERE id = $1 AND ticket_id = $2',
      [params.noteId, params.id]
    );

    if (noteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Work note not found' }, { status: 404 });
    }

    if (noteResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM ticket_work_notes WHERE id = $1', [params.noteId]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Work Notes API] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete work note' },
      { status: 500 }
    );
  }
}
