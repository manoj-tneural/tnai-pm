import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const CYCLE: Record<string, string> = { todo: 'ongoing', ongoing: 'done', done: 'blocked', blocked: 'todo' };

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const { id } = params;

    // Check if this is a task status cycle operation (legacy)
    if (updates.cycleStatus === true) {
      const taskResult = await query('SELECT status FROM deployment_tasks WHERE id = $1', [id]);
      if (taskResult.rows.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const currentStatus = taskResult.rows[0].status;
      const nextStatus = CYCLE[currentStatus] ?? 'todo';

      const updateResult = await query(
        'UPDATE deployment_tasks SET status = $1 WHERE id = $2 RETURNING *',
        [nextStatus, id]
      );

      return NextResponse.json({ task: updateResult.rows[0] });
    }

    // Otherwise, treat as deployment update
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'product_id' && k !== 'cycleStatus');
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => updates[f]);

    const result = await query(
      `UPDATE deployments SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ deployment: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('[Deployments API] PATCH error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update deployment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete associated deployment_tasks first
    await query('DELETE FROM deployment_tasks WHERE deployment_id = $1', [id]);

    // Delete the deployment
    const result = await query('DELETE FROM deployments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Deployments API] DELETE error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete deployment' }, { status: 500 });
  }
}
