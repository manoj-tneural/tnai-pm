import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    // Get the attachment first to get the file path
    const getResult = await query('SELECT file_url FROM dev_task_item_attachments WHERE id = $1', [id]);

    if (getResult.rows.length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const fileUrl = getResult.rows[0].file_url;

    // Delete from database
    await query('DELETE FROM dev_task_item_attachments WHERE id = $1', [id]);

    // Try to delete the file from disk
    try {
      const filePath = join(process.cwd(), 'public', fileUrl);
      await unlink(filePath);
    } catch (err) {
      console.warn('Could not delete physical file:', err);
      // Don't fail if file doesn't exist on disk
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Dev Task Item Attachments DELETE] error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete attachment' }, { status: 500 });
  }
}
