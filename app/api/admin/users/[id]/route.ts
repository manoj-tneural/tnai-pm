import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin (management role)
    const adminResult = await query(
      'SELECT role FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (!adminResult.rows[0] || adminResult.rows[0].role !== 'management') {
      return NextResponse.json({ error: 'Forbidden: Management access only' }, { status: 403 });
    }

    // Get the request body
    const { role } = await request.json();

    if (!role || !['management', 'project_manager', 'engineer', 'testing', 'sales'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role
    const updateResult = await query(
      'UPDATE profiles SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, params.id]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: updateResult.rows[0],
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
