'use server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveDailyLog(data: {
  product_id: string;
  user_id: string;
  log_date: string;
  yesterday?: string;
  today?: string;
  blockers?: string;
  id?: string;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error('Unauthorized');

  const decoded = verifyToken(token);
  if (!decoded) throw new Error('Unauthorized');

  try {
    if (data.id) {
      // Update existing log
      await query(
        `UPDATE daily_logs SET yesterday = $1, today = $2, blockers = $3, updated_at = NOW()
         WHERE id = $4`,
        [data.yesterday || null, data.today || null, data.blockers || null, data.id]
      );
    } else {
      // Insert new log
      await query(
        `INSERT INTO daily_logs (product_id, user_id, log_date, yesterday, today, blockers, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [data.product_id, data.user_id, data.log_date, data.yesterday || null, data.today || null, data.blockers || null]
      );
    }
    revalidatePath(`/products/[slug]/daily`);
    return { success: true };
  } catch (error) {
    console.error('Failed to save daily log:', error);
    throw error;
  }
}

export async function createDeployment(data: {
  product_id: string;
  customer_name: string;
  status: string;
  day0_date?: string;
  notes?: string;
  num_stores: number;
  num_cameras: number;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new Error('Unauthorized');

  const decoded = verifyToken(token);
  if (!decoded) throw new Error('Unauthorized');

  try {
    const result = await query(
      `INSERT INTO deployments (product_id, customer_name, status, day0_date, notes, num_stores, num_cameras, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [
        data.product_id,
        data.customer_name,
        data.status,
        data.day0_date || null,
        data.notes || null,
        data.num_stores,
        data.num_cameras,
      ]
    );

    const deploymentId = result.rows[0].id;

    // Seed deployment tasks (simplified - you may want to do this in a separate query)
    const masterTasks = [
      { day_label: 'Day 0', phase: 'Requirement Gathering', task_no: '1', task_desc: 'Identify all use cases required by client', owner: 'CS', sort_order: 1 },
      { day_label: 'Day 0', phase: 'Requirement Gathering', task_no: '2', task_desc: 'Define success criteria for each use case', owner: 'CS', sort_order: 2 },
    ];

    revalidatePath(`/products/[slug]/deployments`);
    return { success: true, id: deploymentId };
  } catch (error) {
    console.error('Failed to create deployment:', error);
    throw error;
  }
}
