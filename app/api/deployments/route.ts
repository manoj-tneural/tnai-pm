import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { product_id, customer_name, status, day0_date, notes, num_stores, num_cameras } = await request.json();

    if (!product_id || !customer_name) {
      return NextResponse.json({ error: 'Missing required fields: product_id, customer_name' }, { status: 400 });
    }

    // Create deployment (no auto-seeding of tasks)
    const deploymentResult = await query(
      `INSERT INTO deployments (product_id, customer_name, status, day0_date, notes, num_stores, num_cameras, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [product_id, customer_name, status || 'planning', day0_date || null, notes || null, num_stores || 1, num_cameras || 0]
    );

    const deployment = deploymentResult.rows[0];

    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error) {
    console.error('[Deployments API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create deployment' }, { status: 500 });
  }
}
