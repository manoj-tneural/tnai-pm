import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('user_id');

    let result;

    if (role === 'management' || role === 'pm') {
      // PM and Management can see all leaves
      result = await query(
        `SELECT l.*, p.full_name as engineer_name, ap.full_name as approved_by_name
         FROM leaves l
         JOIN profiles p ON l.engineer_id = p.id
         LEFT JOIN profiles ap ON l.approved_by = ap.id
         ORDER BY l.created_at DESC`
      );
    } else {
      // Engineers see only their own leaves
      result = await query(
        `SELECT l.*, p.full_name as engineer_name, ap.full_name as approved_by_name
         FROM leaves l
         JOIN profiles p ON l.engineer_id = p.id
         LEFT JOIN profiles ap ON l.approved_by = ap.id
         WHERE l.engineer_id = $1
         ORDER BY l.created_at DESC`,
        [userId]
      );
    }

    return NextResponse.json({ leaves: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Leaves API] GET error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch leaves' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { engineer_id, leave_type, start_date, end_date, reason } = await request.json();

    if (!engineer_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO leaves (engineer_id, leave_type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [engineer_id, leave_type, start_date, end_date, reason || null]
    );

    return NextResponse.json({ leave: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Leaves API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create leave' }, { status: 500 });
  }
}
