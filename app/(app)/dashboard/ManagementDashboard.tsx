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

export default async function ManagementDashboardPage() {
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
                      Deploys
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Deployments */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Deployments</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Customer</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Product</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(deployments ?? []).slice(0, 5).map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-900">{d.customer_name}</td>
                    <td className="px-4 py-2 text-gray-600">{d.name}</td>
                    <td className="px-4 py-2">
                      <span className={clsx('badge text-xs', STATUS_COLORS.deployment[d.status as keyof typeof STATUS_COLORS.deployment])}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Open Tickets */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎫 Open Tickets</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Ticket</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Assigned</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(tickets ?? []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-900">#{t.ticket_number}</td>
                    <td className="px-4 py-2 text-gray-600">{t.assignee_full_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={clsx('badge text-xs', STATUS_COLORS.priority[t.priority as keyof typeof STATUS_COLORS.priority])}>
                        {t.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Daily Logs */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Recent Daily Logs</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-600 font-semibold">Date</th>
                <th className="text-left px-4 py-2 text-gray-600 font-semibold">Engineer</th>
                <th className="text-left px-4 py-2 text-gray-600 font-semibold">Product</th>
                <th className="text-left px-4 py-2 text-gray-600 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(dailyLogs ?? []).map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-600">{formatDate(log.log_date)}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{log.full_name}</td>
                  <td className="px-4 py-2 text-gray-600">{log.product_name ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600 line-clamp-1">{log.summary ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    );
  } catch (err) {
    console.error('Error loading dashboard:', err);
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
}
