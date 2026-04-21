import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import TicketActions from './TicketActions';
import CommentBox from './CommentBox';

const TYPE_ICON: Record<string, string> = { bug: '🐛', feature: '✨', improvement: '⚡', task: '📋', question: '❓' };
const PRIORITY_ICON: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

const formatDate = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return <div className="p-8 text-red-600">Authentication required</div>;

  try {
    const [ticketResult, commentsResult, engineersResult, profileResult, productsResult] = await Promise.all([
      query(`SELECT t.*, p.name as product_name, p.icon, p.slug, p.color,
                    r.full_name as reporter_full_name, r.role as reporter_role,
                    a.full_name as assignee_full_name, a.role as assignee_role
             FROM tickets t
             LEFT JOIN products p ON t.product_id = p.id
             LEFT JOIN profiles r ON t.reporter_id = r.id
             LEFT JOIN profiles a ON t.assignee_id = a.id
             WHERE t.id = $1`, [params.id]),
      query(`SELECT c.*, p.full_name, p.role
             FROM ticket_comments c
             LEFT JOIN profiles p ON c.user_id = p.id
             WHERE c.ticket_id = $1
             ORDER BY c.created_at`, [params.id]),
      query(`SELECT id, full_name, role FROM profiles WHERE role IN ($1, $2, $3)`, ['engineer', 'project_manager', 'management']),
      query('SELECT * FROM profiles LIMIT 1'),
      query('SELECT id, name, icon, slug FROM products'),
    ]);

    const ticket: any = ticketResult.rows[0];
    const comments: Array<any> = commentsResult.rows;
    const engineers: Array<any> = engineersResult.rows;
    const user: any = profileResult.rows[0];
    const products: Array<any> = productsResult.rows;
    const userId = user?.id;
    
    if (!ticket) notFound();

    const canEdit = user?.role === 'management' || user?.role === 'project_manager' ||
      ticket.reporter_id === userId || ticket.assignee_id === userId;

    return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href="/tickets" className="hover:text-blue-600">Tickets</Link>
        <span>/</span>
        <span className="text-gray-800 truncate max-w-xs">{ticket.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & description */}
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">{TYPE_ICON[ticket.type]}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={clsx('badge', STATUS_COLORS.ticket[ticket.status as keyof typeof STATUS_COLORS.ticket])}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={clsx('badge', STATUS_COLORS.priority[ticket.priority as keyof typeof STATUS_COLORS.priority])}>
                    {PRIORITY_ICON[ticket.priority]} {ticket.priority}
                  </span>
                  <span className="text-gray-400 text-xs">#{ticket.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
            {ticket.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">No description provided.</p>
            )}
          </div>

          {/* Comments */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              💬 Comments ({comments?.length ?? 0})
            </h3>
            <div className="space-y-4 mb-6">
              {(comments ?? []).map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(c.full_name ?? 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{c.full_name}</span>
                      <span className="text-gray-400 text-xs">{c.role}</span>
                      <span className="text-gray-400 text-xs">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                </div>
              ))}
              {(comments ?? []).length === 0 && (
                <p className="text-gray-400 text-sm">No comments yet.</p>
              )}
            </div>
            <CommentBox ticketId={ticket.id} userId={user!.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details card */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Product</dt>
                <dd className="flex items-center gap-1">
                  <span>{ticket.products?.icon}</span>
                  <Link href={`/products/${ticket.products?.slug}/features`} className="text-blue-600 hover:underline">
                    {ticket.products?.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Type</dt>
                <dd>{TYPE_ICON[ticket.type]} {ticket.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Reporter</dt>
                <dd>{ticket.reporter?.full_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Assignee</dt>
                <dd>{ticket.assignee?.full_name ?? <span className="text-gray-400">Unassigned</span>}</dd>
              </div>
              {ticket.due_date && (
                <div>
                  <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Due Date</dt>
                  <dd className={clsx(new Date(ticket.due_date) < new Date() ? 'text-red-600 font-medium' : '')}>
                    {ticket.due_date}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Created</dt>
                <dd className="text-gray-500">{formatDate(ticket.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          {canEdit && (
            <TicketActions
              ticket={ticket}
              currentStatus={ticket.status}
              currentAssignee={ticket.assignee_id}
              engineers={engineers}
              products={products}
            />
          )}
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('Failed to load ticket:', error);
    return <div className="p-8 text-red-600">Error loading ticket</div>;
  }
}
