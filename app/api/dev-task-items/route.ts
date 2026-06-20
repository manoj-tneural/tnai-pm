import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task_id parameter' }, { status: 400 });
    }

    const result = await query(
      `SELECT dti.*, p.full_name as assignee_full_name 
       FROM dev_task_items dti
       LEFT JOIN profiles p ON dti.assignee_id = p.id
       WHERE dti.task_id = $1
       ORDER BY dti.created_at`,
      [taskId]
    );

    return NextResponse.json({ items: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Dev Task Items API] GET error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_id, title, description, planned_start_date, planned_end_date, dev_hours, status, assignee_id } = await request.json();

    if (!task_id || !title) {
      return NextResponse.json({ error: 'Missing required fields: task_id, title' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO dev_task_items (task_id, title, description, planned_start_date, planned_end_date, dev_hours, status, assignee_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [task_id, title, description || null, planned_start_date || null, planned_end_date || null, dev_hours || null, status || 'todo', assignee_id || null]
    );

    return NextResponse.json({ item: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Dev Task Items API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create item' }, { status: 500 });
  }
}
