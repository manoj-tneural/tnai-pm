import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import DailyLogForm from './DailyLogForm';
import clsx from 'clsx';

export default async function DailyPage({ params }: { params: { slug: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    // First get the product ID
    const productIdResult = await query('SELECT id FROM products WHERE slug = $1', [params.slug]);
    const product: any = productIdResult.rows[0];
    if (!product) notFound();

    const [productResult, profileResult, logsResult] = await Promise.all([
      query('SELECT * FROM products WHERE id = $1', [product.id]),
      query('SELECT * FROM profiles WHERE id = $1', [decoded.userId]),
      query(`SELECT dl.*, p.full_name, p.role, p.email
             FROM daily_logs dl
             LEFT JOIN profiles p ON dl.user_id = p.id
             WHERE dl.product_id = $1
             ORDER BY dl.log_date DESC
             LIMIT 50`, [product.id]),
    ]);

    const productData: any = productResult.rows[0];
    const profile: any = profileResult.rows[0];
    const logs: Array<any> = logsResult.rows;

    const today = new Date().toISOString().split('T')[0];
    const myLog = (logs ?? []).find(l => l.user_id === decoded.userId && l.log_date === today);

    // Group by date
    const byDate: Record<string, typeof logs> = {};
    (logs ?? []).forEach(l => {
      if (!byDate[l.log_date]) byDate[l.log_date] = [];
      byDate[l.log_date]!.push(l);
    });
    const dates = Object.keys(byDate).sort().reverse();

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/products/${params.slug}/features`} className="hover:text-blue-600">{productData.name}</Link>
          <span>/</span>
          <span className="text-gray-800">Daily Log</span>
        </div>

        <h1 className="text-2xl font-bold mb-1">{productData.icon} {productData.name} — Daily Standup</h1>
        <p className="text-gray-500 text-sm mb-6">Track daily progress, blockers and plans for the team</p>

        {/* Today's log form */}
        <div className="card p-6 mb-8 border-2" style={{ borderColor: productData.color }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📋</span>
            <h2 className="font-bold text-gray-900">
              {myLog ? "Update today's log" : "Add today's standup"} — {today}
            </h2>
          </div>
          <DailyLogForm
            productId={product.id}
            userId={decoded.userId}
            existingLog={myLog ?? null}
            today={today}
          />
        </div>

        {/* Historical logs grouped by date */}
        {dates.map(date => (
          <section key={date} className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{date}</span>
              <span className="text-xs text-gray-400">{byDate[date]?.length} update{byDate[date]?.length !== 1 ? 's' : ''}</span>
            </h3>
            <div className="space-y-3">
              {byDate[date]?.map(log => (
                <div key={log.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(log.full_name ?? 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{log.full_name ?? 'Unknown'}</span>
                      <span className="text-xs text-gray-400">{log.role}</span>
                    </div>
                    {log.user_id === decoded.userId && <span className="text-xs text-blue-600">Your log</span>}
                  </div>
                  <div className="ml-9 space-y-2">
                    {log.yesterday && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yesterday</span>
                        <p className="text-sm text-gray-700 mt-0.5">{log.yesterday}</p>
                      </div>
                    )}
                    {log.today && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today</span>
                        <p className="text-sm text-gray-700 mt-0.5">{log.today}</p>
                      </div>
                    )}
                    {log.blockers && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">🚧 Blockers</span>
                        <p className="text-sm text-red-700 mt-0.5">{log.blockers}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {dates.length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div>No standup logs yet. Be the first to post today's update!</div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('Error loading daily logs:', err);
    return <div className="p-8 text-red-600">Error loading daily logs</div>;
  }
}
