import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import NewTicketButton from './NewTicketButton';
import TicketRow from './TicketRow';

const formatDate = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string; product?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return <div className="p-8 text-red-600">Authentication required</div>;

  try {
    let ticketQuery = `
      SELECT tickets.*, products.name as product_name, products.icon, products.slug,
             reporter.full_name as reporter_full_name, assignee.full_name as assignee_full_name
      FROM tickets
      LEFT JOIN products ON tickets.product_id = products.id
      LEFT JOIN profiles reporter ON tickets.reporter_id = reporter.id
      LEFT JOIN profiles assignee ON tickets.assignee_id = assignee.id
      WHERE 1=1`;
    const params: any[] = [];

    if (searchParams.status) {
      ticketQuery += ` AND tickets.status = $${params.length + 1}`;
      params.push(searchParams.status);
    }
    if (searchParams.priority) {
      ticketQuery += ` AND tickets.priority = $${params.length + 1}`;
      params.push(searchParams.priority);
    }
    if (searchParams.product) {
      ticketQuery += ` AND products.slug = $${params.length + 1}`;
      params.push(searchParams.product);
    }

    ticketQuery += ` ORDER BY tickets.created_at DESC`;

    const [ticketsResult, productsResult, engineersResult, profileResult] = await Promise.all([
      query(ticketQuery, params),
      query('SELECT id, name, icon, slug FROM products'),
      query(`SELECT id, full_name, role FROM profiles WHERE role IN ($1, $2)`, ['engineer', 'project_manager']),
      query('SELECT * FROM profiles LIMIT 1'), // Get current user profile
    ]);

    const tickets: Array<any> = ticketsResult.rows;
    const products: Array<any> = productsResult.rows;
    const engineers: Array<any> = engineersResult.rows;
    const profile: any = profileResult.rows[0];
    const userId = profile?.id;

    const counts = {
      all: tickets?.length ?? 0,
      open: tickets?.filter(t => t.status === 'open').length ?? 0,
      in_progress: tickets?.filter(t => t.status === 'in_progress').length ?? 0,
      critical: tickets?.filter(t => t.priority === 'critical').length ?? 0,
    };

    const PRIORITY_ICON: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    const TYPE_ICON: Record<string, string> = { bug: '🐛', feature: '✨', improvement: '⚡', task: '📋', question: '❓' };

    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎫 Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">Bugs, tasks, and improvements across all products</p>
          </div>
          <NewTicketButton products={products} engineers={engineers} userId={userId} userRole={profile?.role} />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tickets', value: counts.all, cls: 'bg-gray-50' },
          { label: 'Open', value: counts.open, cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'In Progress', value: counts.in_progress, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Critical', value: counts.critical, cls: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={clsx('card p-4', s.cls)}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Filter:</span>
        {['open', 'in_progress', 'in_review', 'resolved', 'closed'].map(s => (
          <Link
            key={s}
            href={searchParams.status === s ? '/tickets' : `/tickets?status=${s}`}
            className={clsx(
              'badge cursor-pointer transition-colors',
              searchParams.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
        <span className="text-gray-300">|</span>
        {['critical', 'high', 'medium', 'low'].map(p => (
          <Link
            key={p}
            href={searchParams.priority === p ? '/tickets' : `/tickets?priority=${p}`}
            className={clsx(
              'badge cursor-pointer transition-colors',
              searchParams.priority === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {PRIORITY_ICON[p]} {p}
          </Link>
        ))}
      </div>

      {/* Tickets table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-20">Priority</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-28">Product</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Assignee</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-20">Created</th>
              <th className="text-left px-4 py-3 text-gray-600 font-semibold w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(tickets ?? []).map(t => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </tbody>
        </table>
        {(tickets ?? []).length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">🎉</div>
            <div>No tickets matching your filter. All clear!</div>
          </div>
        )}
      </div>
    </div>
    );
  } catch (error) {
    console.error('Failed to load tickets:', error);
    return <div className="p-8 text-red-600">Error loading tickets</div>;
  }
}
