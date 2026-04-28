import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { deployment_id, day_label, phase, task_no, task_desc, owner, status, remarks, start_date, end_date } = await request.json();

    if (!deployment_id || !task_desc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO deployment_tasks (deployment_id, day_label, phase, task_no, task_desc, owner, status, remarks, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [deployment_id, day_label || null, phase || null, task_no || null, task_desc, owner || null, status || 'todo', remarks || null, start_date || null, end_date || null]
    );

    return NextResponse.json({ task: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Deployment Tasks API] POST error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
