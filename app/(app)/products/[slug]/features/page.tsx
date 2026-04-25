import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import NewFeatureButton from './NewFeatureButton';
import FeatureRow from './FeatureRow';
import StatusFilterCards from './StatusFilterCards';

export default async function FeaturesPage({ params, searchParams }: { params: { slug: string }; searchParams: { status?: string } }) {
  try {
    const [productResult, featuresResult, engineersResult] = await Promise.all([
      query('SELECT * FROM products WHERE slug = $1', [params.slug]),
      query('SELECT * FROM features ORDER BY created_at DESC'),
      query(`SELECT id, full_name, role FROM profiles WHERE role IN ($1, $2, $3)`, ['engineer', 'project_manager', 'management']),
    ]);

    const product: any = productResult.rows[0];
    if (!product) notFound();

    const allFeatures: Array<any> = featuresResult.rows.filter((f: any) => f.product_id === product.id);
    
    // Filter by status if provided
    const selectedStatus = searchParams.status;
    const features: Array<any> = selectedStatus 
      ? allFeatures.filter((f: any) => f.status === selectedStatus)
      : allFeatures;
    
    const engineers: Array<any> = engineersResult.rows;

    const categories = [...new Set((features ?? []).map((f: any) => f.category).filter(Boolean))];
    const byCategory = (cat: string) => (features ?? []).filter((f: any) => f.category === cat);

    const stats = {
      total: allFeatures?.length ?? 0,
      completed: allFeatures?.filter((f: any) => f.status === 'completed').length ?? 0,
      in_progress: allFeatures?.filter((f: any) => f.status === 'in_progress').length ?? 0,
      planned: allFeatures?.filter((f: any) => f.status === 'planned').length ?? 0,
    };

    return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span>{product.name}</span>
            <span>/</span>
            <span className="text-gray-800">Features</span>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: product.color + '20' }}>
                {product.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name} — Features</h1>
                <p className="text-gray-500 text-sm mt-1">{product.tagline}</p>
              </div>
            </div>
            <NewFeatureButton productId={product.id} engineers={engineers} />
          </div>
        </div>

      {/* Status Filter Cards */}
      <StatusFilterCards stats={stats} selectedStatus={selectedStatus} productSlug={params.slug} />

      {/* Active Filter Indicator */}
      {selectedStatus && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-blue-700">
            Showing <span className="font-semibold">{selectedStatus.replace('_', ' ')}</span> features ({features.length} of {allFeatures.length})
          </div>
          <Link href={`/products/${params.slug}/features`} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">
            Clear Filter
          </Link>
        </div>
      )}

      {/* Tech stack */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Tech Stack:</span>
          {(product.tech_stack ?? []).map((t: string) => (
            <span key={t} className="px-2.5 py-1 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono">{t}</span>
          ))}
        </div>
      </div>

      {/* Features by category */}
      {categories.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <div>No features found {selectedStatus ? `with status "${selectedStatus.replace('_', ' ')}"` : ''}.</div>
        </div>
      ) : (
        categories.map(cat => (
        <section key={cat} className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full" style={{ backgroundColor: product.color }} />
            {cat}
            <span className="text-sm font-normal text-gray-400">({byCategory(cat!).length} features)</span>
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">ID</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Feature</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-28">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Start Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">End Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-20">Hours</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-20">Accuracy</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-40">Assigned To</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byCategory(cat!).map(f => (
                  <FeatureRow key={f.id} feature={f} engineers={engineers} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
        ))
      )}

      {/* Tech details section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔬 Technical Details</h2>
        <div className="card p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-semibold text-gray-500 mb-2">Full Description</dt>
              <dd className="text-gray-800 text-sm leading-relaxed">{product.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500 mb-2">Full Tech Stack</dt>
              <dd className="flex flex-wrap gap-2">
                {(product.tech_stack ?? []).map((t: string) => (
                  <span key={t} className="px-2.5 py-1 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono">{t}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500 mb-2">Product Status</dt>
              <dd><span className={clsx('badge', product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{product.status}</span></dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500 mb-2">Feature Completion</dt>
              <dd>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%`, backgroundColor: product.color }} />
                  </div>
                  <span className="text-sm font-semibold">{Math.round((stats.completed / stats.total) * 100)}%</span>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
    );
  } catch (error) {
    console.error('Failed to load features:', error);
    return <div className="p-8 text-red-600">Error loading features</div>;
  }
}
