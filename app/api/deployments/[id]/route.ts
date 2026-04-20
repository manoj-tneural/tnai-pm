import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';

const CYCLE: Record<string, string> = { todo: 'ongoing', ongoing: 'done', done: 'blocked', blocked: 'todo' };

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify auth
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get current status
    const taskResult = await query('SELECT status FROM deployment_tasks WHERE id = $1', [params.id]);
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const currentStatus = taskResult.rows[0].status;
    const nextStatus = CYCLE[currentStatus] ?? 'todo';

    // Update task status
    const updateResult = await query(
      'UPDATE deployment_tasks SET status = $1 WHERE id = $2 RETURNING *',
      [nextStatus, params.id]
    );

    return NextResponse.json({ task: updateResult.rows[0] });
  } catch (error) {
    console.error('Task status update error:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}
