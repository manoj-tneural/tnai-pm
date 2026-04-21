'use server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateTicket(ticketId: string, data: { status?: string; assignee_id?: string | null }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');

  try {
    await query(
      `UPDATE tickets SET status = COALESCE($1, status), 
              assignee_id = CASE WHEN $2 = 'null' THEN NULL ELSE COALESCE($2, assignee_id) END,
              updated_at = NOW()
       WHERE id = $3`,
      [data.status || null, data.assignee_id || null, ticketId]
    );
    revalidatePath('/tickets');
    return { success: true };
  } catch (error) {
    console.error('Failed to update ticket:', error);
    throw error;
  }
}

export async function createTicket(data: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  product_id: string;
  assignee_id?: string;
  due_date?: string;
  reporter_id: string;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');

  try {
    const result = await query(
      `INSERT INTO tickets (title, description, type, priority, product_id, assignee_id, due_date, reporter_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', NOW(), NOW())
       RETURNING id`,
      [
        data.title,
        data.description || null,
        data.type,
        data.priority,
        data.product_id,
        data.assignee_id || null,
        data.due_date || null,
        data.reporter_id,
      ]
    );
    revalidatePath('/tickets');
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('Failed to create ticket:', error);
    throw error;
  }
}

export async function addComment(ticketId: string, userId: string, comment: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Unauthorized');

  try {
    await query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [ticketId, userId, comment.trim()]
    );
    revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add comment:', error);
    throw error;
  }
}
