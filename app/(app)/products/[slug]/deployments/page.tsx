import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import NewDeploymentButton from './NewDeploymentButton';
import DeploymentCard from './DeploymentCard';
import DeploymentStatusFilter from './DeploymentStatusFilter';

export default async function DeploymentsPage({ params, searchParams }: { params: { slug: string }; searchParams: { status?: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  try {
    const productResult = await query('SELECT * FROM products WHERE slug = $1', [params.slug]);
    const product = productResult.rows[0];
    if (!product) notFound();

    const deploymentsResult = await query(
      'SELECT * FROM deployments WHERE product_id = $1 ORDER BY created_at DESC',
      [product.id]
    );
    const allDeployments: Array<any> = deploymentsResult.rows;

    const stats = {
      total: allDeployments?.length ?? 0,
      planning: allDeployments?.filter(d => d.status === 'planning').length ?? 0,
      active: allDeployments?.filter(d => d.status === 'in_progress').length ?? 0,
      done: allDeployments?.filter(d => d.status === 'completed').length ?? 0,
    };

    // Filter deployments based on status parameter
    const deployments = searchParams.status 
      ? allDeployments.filter(d => d.status === searchParams.status)
      : allDeployments;

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

      {/* Stats Cards - Clickable Filter */}
      <DeploymentStatusFilter 
        stats={stats} 
        currentStatus={searchParams.status}
        productSlug={params.slug}
      />

      {/* Filter indicator */}
      {searchParams.status && (
        <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-gray-700">
            Filtering by: <span className="font-semibold capitalize">{searchParams.status.replace('_', ' ')}</span>
          </span>
          <Link 
            href={`/products/${params.slug}/deployments`}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filter
          </Link>
        </div>
      )}

      {/* Deployment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(deployments ?? []).map(d => (
          <DeploymentCard key={d.id} deployment={d} productSlug={params.slug} />
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
