import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import NewDeploymentButton from './NewDeploymentButton';

export default async function DeploymentsPage({ params }: { params: { slug: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  const decoded = verifyToken(token);
  if (!decoded) redirect('/auth/login');

  try {
    const productResult = await query('SELECT * FROM products WHERE slug = $1', [params.slug]);
    const product = productResult.rows[0];
    if (!product) notFound();

    const deploymentsResult = await query(
      'SELECT * FROM deployments WHERE product_id = $1 ORDER BY created_at DESC',
      [product.id]
    );
    const deployments: Array<any> = deploymentsResult.rows;

    const stats = {
      total: deployments?.length ?? 0,
      planning: deployments?.filter(d => d.status === 'planning').length ?? 0,
      active: deployments?.filter(d => d.status === 'in_progress').length ?? 0,
      done: deployments?.filter(d => d.status === 'completed').length ?? 0,
    };

    return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href={`/products/${params.slug}/features`} className="hover:text-blue-600">{product.name}</Link>
        <span>/</span>
        <span className="text-gray-800">Deployments</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.icon} {product.name} — Customer Deployments</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} deployments · {stats.active} active · {stats.done} completed</p>
        </div>
        <NewDeploymentButton productId={product.id} productSlug={params.slug} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-gray-50' },
          { label: 'Planning', value: stats.planning, cls: 'bg-gray-50 text-gray-600' },
          { label: 'Active', value: stats.active, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Completed', value: stats.done, cls: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={clsx('card p-4', s.cls)}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Deployment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(deployments ?? []).map(d => (
          <Link key={d.id} href={`/products/${params.slug}/deployments/${d.id}`}
            className="card p-5 hover:shadow-md transition-shadow block">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900 text-lg">{d.customer_name}</div>
                {d.day0_date && <div className="text-xs text-gray-400 mt-0.5">Started: {d.day0_date}</div>}
              </div>
              <span className={clsx('badge', STATUS_COLORS.deployment[d.status as keyof typeof STATUS_COLORS.deployment])}>
                {d.status.replace('_', ' ')}
              </span>
            </div>
            {d.notes && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{d.notes}</p>}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {d.num_stores > 0 && <span>🏪 {d.num_stores} {d.num_stores === 1 ? 'store' : 'stores'}</span>}
              {d.num_cameras > 0 && <span>📷 {d.num_cameras} cameras</span>}
              <span className="ml-auto text-blue-600 font-medium">View plan →</span>
            </div>
          </Link>
        ))}
      </div>

      {deployments?.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🚀</div>
          <div className="font-medium">No deployments yet</div>
          <div className="text-sm mt-1">Add your first customer deployment to get started</div>
        </div>
      )}
    </div>
    );
  } catch (err) {
    return <div className="p-8 text-center text-red-600">Error loading deployments</div>;
  }
}
