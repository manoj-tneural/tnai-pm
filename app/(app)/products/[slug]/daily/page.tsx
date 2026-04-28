import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import DailyLogForm from './DailyLogForm';
import DailyLogCard from './DailyLogCard';
import clsx from 'clsx';

export default async function DailyPage({ params }: { params: { slug: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return <div className="p-8 text-red-600">Authentication required</div>;

  // Verify token and get userId
  const decoded = verifyToken(token);
  if (!decoded) redirect('/auth/login');

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
    const userId = profile?.id;

    const formatDate = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      return new Date(date).toISOString().split('T')[0];
    };

    const today = new Date().toISOString().split('T')[0];
    const myLog = (logs ?? []).find(l => l.user_id === userId && formatDate(l.log_date) === today);

    // Group by date
    const byDate: Record<string, typeof logs> = {};
    (logs ?? []).forEach(l => {
      const dateKey = formatDate(l.log_date);
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey]!.push(l);
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
            userId={userId}
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
                <DailyLogCard key={log.id} log={log} currentUserId={userId} />
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
