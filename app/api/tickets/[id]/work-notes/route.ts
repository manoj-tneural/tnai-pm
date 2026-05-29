import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT wn.*, p.full_name, p.role
       FROM ticket_work_notes wn
       LEFT JOIN profiles p ON wn.user_id = p.id
       WHERE wn.ticket_id = $1
       ORDER BY wn.created_at DESC`,
      [params.id]
    );

    return NextResponse.json({ workNotes: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Work Notes API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch work notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!userId) {
      return NextResponse.json({ error: 'Could not extract user ID from token' }, { status: 401 });
    }

    const { work_note } = await request.json();

    if (!work_note || !work_note.trim()) {
      return NextResponse.json({ error: 'Work note cannot be empty' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO ticket_work_notes (ticket_id, user_id, work_note, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [params.id, userId, work_note]
    );

    return NextResponse.json({ workNote: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Work Notes API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create work note' },
      { status: 500 }
    );
  }
}
