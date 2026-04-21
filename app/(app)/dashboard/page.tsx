import Link from 'next/link';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';

// Make this page dynamic - don't try to build it statically
export const dynamic = 'force-dynamic';

const formatDate = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return new Date(date).toISOString().split('T')[0];
};

export default async function DashboardPage() {
  try {
    const [
      productsResult,
      featuresResult,
      deploymentsResult,
      ticketsResult,
      devTasksResult,
      dailyLogsResult,
    ] = await Promise.all([
      query('SELECT * FROM products ORDER BY name'),
      query('SELECT * FROM features'),
      query(`SELECT deployments.*, products.name, products.slug, products.icon, products.color 
             FROM deployments 
             JOIN products ON deployments.product_id = products.id`),
      query(`SELECT tickets.*, products.name, profiles.full_name as assignee_full_name
             FROM tickets
             LEFT JOIN products ON tickets.product_id = products.id
             LEFT JOIN profiles ON tickets.assignee_id = profiles.id
             WHERE tickets.status = $1
             ORDER BY tickets.created_at DESC
             LIMIT 8`, ['open']),
      query('SELECT * FROM dev_tasks'),
      query(`SELECT daily_logs.*, profiles.full_name, profiles.role, products.name as product_name, products.icon
             FROM daily_logs
             LEFT JOIN profiles ON daily_logs.user_id = profiles.id
             LEFT JOIN products ON daily_logs.product_id = products.id
             ORDER BY daily_logs.log_date DESC
             LIMIT 10`),
    ]);

    const products: Array<any> = productsResult.rows;
    const features: Array<any> = featuresResult.rows;
    const deployments: Array<any> = deploymentsResult.rows;
    const tickets: Array<any> = ticketsResult.rows;
    const devTasks: Array<any> = devTasksResult.rows;
    const dailyLogs: Array<any> = dailyLogsResult.rows;

    const featuresByProduct = (slug: string) => {
      const p = products?.find(x => x.slug === slug);
      if (!p) return { total: 0, done: 0 };
      const pf = (features ?? []).filter(f => f.product_id === p.id);
      return { total: pf.length, done: pf.filter(f => f.status === 'completed').length };
    };

    const deploymentsByProduct = (slug: string) => {
      const p = products?.find(x => x.slug === slug);
      if (!p) return { total: 0, active: 0, done: 0 };
      const deps = (deployments ?? []).filter(d => d.product_id === p.id);
      return { total: deps.length, active: deps.filter(d => d.status === 'in_progress').length, done: deps.filter(d => d.status === 'completed').length };
    };

    const openTickets = (tickets ?? []).length;
    const totalDeployments = (deployments ?? []).length;
    const activeDeployments = (deployments ?? []).filter(d => d.status === 'in_progress').length;
    const totalFeatures = (features ?? []).length;
    const completedFeatures = (features ?? []).filter(f => f.status === 'completed').length;

    return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏠 Project Hub</h1>
        <p className="text-gray-500 mt-1">Thinkneural AI — All products, deployments and team activity at a glance</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Features Built', value: `${completedFeatures}/${totalFeatures}`, icon: '⚡', color: 'bg-blue-50 text-blue-700' },
          { label: 'Active Deployments', value: activeDeployments, icon: '🚀', color: 'bg-green-50 text-green-700' },
          { label: 'Total Customers', value: totalDeployments, icon: '🏢', color: 'bg-purple-50 text-purple-700' },
          { label: 'Open Tickets', value: openTickets, icon: '🎫', color: 'bg-orange-50 text-orange-700' },
        ].map(stat => (
          <div key={stat.label} className={clsx('card p-5', stat.color)}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Products grid */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(products ?? []).map(p => {
            const feat = featuresByProduct(p.slug);
            const deps = deploymentsByProduct(p.slug);
            const pct = feat.total ? Math.round((feat.done / feat.total) * 100) : 0;
            return (
              <div key={p.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                {/* Color top bar */}
                <div className="h-2" style={{ backgroundColor: p.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl mb-1">{p.icon}</div>
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{p.tagline}</p>
                    </div>
                    <span className={clsx('badge', p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                      {p.status}
                    </span>
                  </div>

                  {/* Feature progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Feature Progress</span>
                      <span>{feat.done}/{feat.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 text-xs text-gray-500 mb-4">
                    <span>🚀 {deps.active} active deploys</span>
                    <span>✅ {deps.done} completed</span>
                  </div>

                  {/* Tech stack pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(p.tech_stack ?? []).slice(0, 5).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
                    ))}
                    {(p.tech_stack ?? []).length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{p.tech_stack.length - 5} more</span>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex gap-2">
                    <Link href={`/products/${p.slug}/features`} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                      Features
                    </Link>
                    <Link href={`/products/${p.slug}/deployments`} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                      Deployments
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Deployments */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🚀 Active Customer Deployments</h2>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Product</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(deployments ?? []).map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.customer_name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span>{d.products?.icon}</span>
                      <span className="text-gray-600">{d.products?.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', STATUS_COLORS.deployment[d.status as keyof typeof STATUS_COLORS.deployment])}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{d.notes}</td>
                  <td className="px-4 py-3">
                    <Link href={`/products/${d.products?.slug}/deployments/${d.id}`}
                      className="text-blue-600 hover:underline text-xs">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom two columns: tickets + daily logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Tickets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🎫 Open Tickets</h2>
            <Link href="/tickets" className="text-blue-600 text-sm hover:underline">View all →</Link>
          </div>
          <div className="card divide-y divide-gray-100">
            {(tickets ?? []).length === 0 && (
              <div className="p-6 text-center text-gray-400">No open tickets 🎉</div>
            )}
            {(tickets ?? []).map(t => (
              <Link key={t.id} href={`/tickets/${t.id}`}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors block">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{t.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={clsx('badge text-xs', STATUS_COLORS.priority[t.priority as keyof typeof STATUS_COLORS.priority])}>
                      {t.priority}
                    </span>
                    <span className="text-gray-400 text-xs">{t.products?.name}</span>
                    {t.assignee?.full_name && <span className="text-gray-400 text-xs">→ {t.assignee.full_name}</span>}
                  </div>
                </div>
                <span className={clsx('badge text-xs flex-shrink-0', STATUS_COLORS.ticket[t.status as keyof typeof STATUS_COLORS.ticket])}>
                  {t.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Daily Logs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📋 Recent Daily Logs</h2>
            <Link href="/daily" className="text-blue-600 text-sm hover:underline">View all →</Link>
          </div>
          <div className="card divide-y divide-gray-100">
            {(dailyLogs ?? []).length === 0 && (
              <div className="p-6 text-center text-gray-400">No logs yet. Add today's update!</div>
            )}
            {(dailyLogs ?? []).map(log => (
              <div key={log.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{log.profiles?.full_name ?? 'Unknown'}</span>
                    <span className="text-gray-400 text-xs">{log.products?.icon} {log.products?.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{formatDate(log.log_date)}</span>
                </div>
                {log.today && <p className="text-sm text-gray-600 truncate">Today: {log.today}</p>}
                {log.blockers && <p className="text-sm text-red-500 truncate">🚧 {log.blockers}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to load dashboard:', error);
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Dashboard Error</h1>
          <div className="bg-white border border-red-300 rounded-lg p-6 mb-4">
            <p className="text-red-700 font-mono whitespace-pre-wrap break-words">{errorMessage}</p>
          </div>
          <p className="text-gray-600 mb-4">
            This error occurred while loading dashboard data. Check the server logs for more details.
          </p>
          <p className="text-gray-500 text-sm">
            Full error logged to browser console (F12 → Console tab)
          </p>
        </div>
      </div>
    );
  }
}
