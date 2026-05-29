import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/tickets');

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get attachment record to get file path
    const attachmentResult = await query(
      'SELECT file_path FROM ticket_attachments WHERE id = $1 AND ticket_id = $2',
      [params.attachmentId, params.id]
    );

    if (attachmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const filePath = attachmentResult.rows[0].file_path;

    // Delete file from filesystem
    try {
      const fullPath = join(process.cwd(), 'public', filePath);
      await unlink(fullPath);
    } catch (err) {
      console.warn('[Attachments API] Could not delete file:', err);
      // Continue even if file deletion fails
    }

    // Delete attachment record from database
    await query('DELETE FROM ticket_attachments WHERE id = $1', [params.attachmentId]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Attachments API] DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}
