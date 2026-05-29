import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/tickets');

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/tickets/${filename}`;

    // Save file
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Insert attachment record into database
    const result = await query(
      `INSERT INTO ticket_attachments (ticket_id, file_name, file_size, file_path, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [params.id, file.name, file.size, publicPath, file.type, userId]
    );

    return NextResponse.json({ attachment: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[File Upload API] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT ta.*, p.full_name as uploaded_by_name
       FROM ticket_attachments ta
       LEFT JOIN profiles p ON ta.uploaded_by = p.id
       WHERE ta.ticket_id = $1
       ORDER BY ta.created_at DESC`,
      [params.id]
    );

    return NextResponse.json({ attachments: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Attachments API] GET error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Delete attachment record
    await query('DELETE FROM ticket_attachments WHERE id = $1', [params.id]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Attachments API] DELETE error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete attachment' }, { status: 500 });
  }
}
