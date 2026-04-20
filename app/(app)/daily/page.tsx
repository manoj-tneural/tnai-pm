import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function GlobalDailyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/auth/login');

  // Fetch products, daily logs, and current user profile
  const [productsResult, logsResult, profileResult] = await Promise.all([
    query('SELECT id, name, icon, slug, color FROM products'),
    query('SELECT dl.*, p.full_name, p.role, pr.name, pr.icon, pr.slug, pr.color FROM daily_logs dl JOIN profiles p ON dl.user_id = p.id JOIN products pr ON dl.product_id = pr.id ORDER BY log_date DESC LIMIT 100'),
    query('SELECT id FROM profiles LIMIT 1'),
  ]);

  const products: Array<any> = productsResult.rows;
  const logs: Array<any> = logsResult.rows;
  const profile = profileResult.rows[0];
  const userId = profile?.id;

  const today = new Date().toISOString().split('T')[0];

  // Group by date
  const byDate: Record<string, typeof logs> = {};
  (logs ?? []).forEach(l => {
    if (!byDate[l.log_date]) byDate[l.log_date] = [];
    byDate[l.log_date]!.push(l);
  });
  const dates = Object.keys(byDate).sort().reverse();

  // My pending products (no log today)
  const myLogsToday = (logs ?? []).filter(l => l.user_id === userId && l.log_date === today);
  const myLoggedProducts = myLogsToday.map(l => l.product_id);
  const pendingProducts = (products ?? []).filter(p => !myLoggedProducts.includes(p.id));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">📋 Daily Standup Hub</h1>
      <p className="text-gray-500 text-sm mb-6">All team updates across products</p>

      {/* Quick log links */}
      {pendingProducts.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-orange-400">
          <p className="text-sm font-semibold text-orange-700 mb-2">⏰ You haven't logged today for:</p>
          <div className="flex gap-3 flex-wrap">
            {pendingProducts.map(p => (
              <Link key={p.id} href={`/products/${p.slug}/daily`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: p.color }}>
                {p.icon} {p.name} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {dates.map(date => (
        <section key={date} className="mb-8">
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            📅 {date}
            {date === today && <span className="badge bg-green-100 text-green-700">Today</span>}
            <span className="text-sm font-normal text-gray-400">— {byDate[date]?.length} update{byDate[date]?.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="space-y-3">
            {byDate[date]?.map(log => (
              <div key={log.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: log.products?.color ?? '#3b82f6' }}>
                      {(log.profiles?.full_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{log.profiles?.full_name ?? 'Unknown'}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{log.profiles?.role}</span>
                        <span>·</span>
                        <Link href={`/products/${log.products?.slug}/daily`} className="hover:text-blue-600">
                          {log.products?.icon} {log.products?.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.yesterday && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Yesterday</div>
                      <p className="text-sm text-gray-700">{log.yesterday}</p>
                    </div>
                  )}
                  {log.today && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Today</div>
                      <p className="text-sm text-gray-700">{log.today}</p>
                    </div>
                  )}
                  {log.blockers && (
                    <div className="md:col-span-2">
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">🚧 Blocker</div>
                        <p className="text-sm text-red-700">{log.blockers}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {dates.length === 0 && (
        <div className="card p-16 text-center text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-lg font-medium">No standup logs yet</div>
          <p className="mt-2 text-sm">Post your first daily update from any product page.</p>
        </div>
      )}
    </div>
  );
}
