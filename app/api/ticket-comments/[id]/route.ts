import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { comment } = await request.json();
    if (!comment?.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    // Get current comment to verify ownership
    const currentResult = await query(
      'SELECT user_id FROM ticket_comments WHERE id = $1',
      [params.id]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

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
    }

    // Verify ownership
    if (currentResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Cannot edit another user\'s comment' }, { status: 403 });
    }

    // Update comment
    const result = await query(
      'UPDATE ticket_comments SET comment = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [comment.trim(), params.id]
    );

    return NextResponse.json({ comment: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('[Comment API] PATCH error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get comment to verify ownership
    const commentResult = await query(
      'SELECT user_id FROM ticket_comments WHERE id = $1',
      [params.id]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

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
    }

    // Verify ownership
    if (commentResult.rows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Cannot delete another user\'s comment' }, { status: 403 });
    }

    // Delete comment
    await query('DELETE FROM ticket_comments WHERE id = $1', [params.id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Comment API] DELETE error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete comment' }, { status: 500 });
  }
}
