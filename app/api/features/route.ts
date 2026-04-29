import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { product_id, feature_id, name, category, status, dev_hours, llm_based, pre_trained, deployment_type, cost, accuracy, requirements, notes, sort_order, start_date, end_date, assigned_to } = await request.json();

    if (!product_id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertQuery = `INSERT INTO features (product_id, feature_id, name, category, status, dev_hours, llm_based, pre_trained, deployment_type, cost, accuracy, requirements, notes, sort_order, start_date, end_date, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`;
    
    const insertValues = [product_id, feature_id, name, category, status || 'planned', dev_hours, llm_based || false, pre_trained, deployment_type, cost, accuracy || null, requirements, notes, sort_order || 0, start_date || null, end_date || null, assigned_to || null];
    
    console.log('[Features API] INSERT Query:', insertQuery);
    console.log('[Features API] Column count: 17 (product_id, feature_id, name, category, status, dev_hours, llm_based, pre_trained, deployment_type, cost, accuracy, requirements, notes, sort_order, start_date, end_date, assigned_to)');
    console.log('[Features API] Value count:', insertValues.length);
    console.log('[Features API] Values:', insertValues);

    const result = await query(insertQuery, insertValues);

    return NextResponse.json({ feature: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[Features API] POST error:', error);
    if (error instanceof Error) {
      console.error('[Features API] Error message:', error.message);
      console.error('[Features API] Error stack:', error.stack);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create feature' }, { status: 500 });
  }
}
