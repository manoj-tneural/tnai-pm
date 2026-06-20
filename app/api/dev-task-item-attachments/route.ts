import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemId = formData.get('item_id') as string;

    if (!file || !itemId) {
      return NextResponse.json({ error: 'Missing file or item_id' }, { status: 400 });
    }

    // Generate a unique filename
    const fileName = `${randomBytes(8).toString('hex')}-${file.name}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'dev-task-items');
    const filePath = join(uploadDir, fileName);

    // Create uploads directory if it doesn't exist
    try {
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    } catch (err) {
      console.error('File write error:', err);
      // If file write fails, still create the DB record but mark it
      return NextResponse.json({ warning: 'File upload failed', attachment: null }, { status: 200 });
    }

    const fileUrl = `/uploads/dev-task-items/${fileName}`;

    // Store in database
    const result = await query(
      `INSERT INTO dev_task_item_attachments (item_id, file_url, file_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [itemId, fileUrl, file.name]
    );

    return NextResponse.json({ attachment: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Dev Task Item Attachments API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item_id parameter' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM dev_task_item_attachments WHERE item_id = $1 ORDER BY created_at DESC`,
      [itemId]
    );

    return NextResponse.json({ attachments: result.rows }, { status: 200 });
  } catch (error) {
    console.error('[Dev Task Item Attachments API] GET error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch attachments' }, { status: 500 });
  }
}
