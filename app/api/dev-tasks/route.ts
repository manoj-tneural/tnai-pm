import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { product_id, phase, task_id, sub_task, description, dev_hours, planned_start, planned_end, status, assignee_id } = await request.json();

    if (!product_id || !sub_task) {
      return NextResponse.json({ error: 'Missing required fields: product_id, sub_task' }, { status: 400 });
    }

    const insertQuery = `INSERT INTO dev_tasks (product_id, phase, task_id, sub_task, description, dev_hours, planned_start, planned_end, status, assignee_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`;
    
    const insertValues = [product_id, phase, task_id, sub_task, description, dev_hours, planned_start || null, planned_end || null, status || 'todo', assignee_id || null];
    
    console.log('[Dev Tasks API] INSERT Query:', insertQuery);
    console.log('[Dev Tasks API] Column count: 10 (product_id, phase, task_id, sub_task, description, dev_hours, planned_start, planned_end, status, assignee_id)');
    console.log('[Dev Tasks API] Value count:', insertValues.length);
    console.log('[Dev Tasks API] Values:', insertValues);

    const result = await query(insertQuery, insertValues);

    return NextResponse.json({ task: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Dev Tasks API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create task' }, { status: 500 });
  }
}
