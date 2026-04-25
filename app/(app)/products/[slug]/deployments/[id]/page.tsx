import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import TaskStatusToggle from './TaskStatusToggle';
import NewDeploymentTaskButton from './NewDeploymentTaskButton';
import DeploymentTaskRow from './DeploymentTaskRow';

export default async function DeploymentDetailPage({ params, searchParams }: { params: { slug: string; id: string }; searchParams: { status?: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  try {
    const [productResult, deploymentResult, tasksResult] = await Promise.all([
      query('SELECT * FROM products WHERE slug = $1', [params.slug]),
      query('SELECT * FROM deployments WHERE id = $1', [params.id]),
      query('SELECT * FROM deployment_tasks WHERE deployment_id = $1 ORDER BY created_at ASC', [params.id]),
    ]);

    const product = productResult.rows[0];
    const deployment = deploymentResult.rows[0];
    const allTasks: Array<any> = tasksResult.rows;

    if (!product || !deployment) notFound();

    // Filter tasks based on status parameter
    const tasks = searchParams.status 
      ? allTasks.filter(t => t.status === searchParams.status)
      : allTasks;

    // Calculate stats from ALL tasks
    const stats = {
      total: allTasks.length,
      done: allTasks.filter(t => t.status === 'done').length,
      ongoing: allTasks.filter(t => t.status === 'ongoing').length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      blocked: allTasks.filter(t => t.status === 'blocked').length,
    };

    const phases = [...new Set((tasks ?? []).map(t => t.phase).filter(Boolean))];
    const byPhase = (phase: string) => (tasks ?? []).filter(t => t.phase === phase);

    const done = (tasks ?? []).filter(t => t.status === 'done').length;
    const total = (tasks ?? []).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
        <span>/</span>
        <Link href={`/products/${params.slug}/deployments`} className="hover:text-blue-600">{product.name}</Link>
        <span>/</span>
        <span className="text-gray-800">{deployment.customer_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{deployment.customer_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={clsx('badge', STATUS_COLORS.deployment[deployment.status as keyof typeof STATUS_COLORS.deployment])}>
              {deployment.status.replace('_', ' ')}
            </span>
            {deployment.day0_date && <span className="text-gray-400 text-sm">Day 0: {deployment.day0_date}</span>}
            {deployment.num_stores > 0 && <span className="text-gray-400 text-sm">🏪 {deployment.num_stores} stores</span>}
            {deployment.num_cameras > 0 && <span className="text-gray-400 text-sm">📷 {deployment.num_cameras} cameras</span>}
          </div>
          {deployment.notes && <p className="text-gray-500 text-sm mt-2">{deployment.notes}</p>}
        </div>
        <NewDeploymentTaskButton deploymentId={deployment.id} />
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700">Overall Progress</span>
          <span className="font-bold" style={{ color: product.color }}>{done}/{total} tasks completed ({pct}%)</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: product.color }} />
        </div>
        
        {/* Status Filter Cards */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href={`/products/${params.slug}/deployments/${deployment.id}`} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all', !searchParams.status ? 'bg-gray-200 text-gray-900 ring-2 ring-gray-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-150')}>
            All ({stats.total})
          </Link>
          <Link href={`/products/${params.slug}/deployments/${deployment.id}?status=done`} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all', searchParams.status === 'done' ? 'bg-green-200 text-green-900 ring-2 ring-green-400' : 'bg-green-100 text-green-600 hover:bg-green-150')}>
            ✅ Done ({stats.done})
          </Link>
          <Link href={`/products/${params.slug}/deployments/${deployment.id}?status=ongoing`} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all', searchParams.status === 'ongoing' ? 'bg-blue-200 text-blue-900 ring-2 ring-blue-400' : 'bg-blue-100 text-blue-600 hover:bg-blue-150')}>
            🔄 Ongoing ({stats.ongoing})
          </Link>
          <Link href={`/products/${params.slug}/deployments/${deployment.id}?status=todo`} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all', searchParams.status === 'todo' ? 'bg-gray-300 text-gray-900 ring-2 ring-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-250')}>
            ⬜ Todo ({stats.todo})
          </Link>
          <Link href={`/products/${params.slug}/deployments/${deployment.id}?status=blocked`} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all', searchParams.status === 'blocked' ? 'bg-red-200 text-red-900 ring-2 ring-red-400' : 'bg-red-100 text-red-600 hover:bg-red-150')}>
            🚫 Blocked ({stats.blocked})
          </Link>
        </div>

        {/* Filter indicator */}
        {searchParams.status && (
          <div className="mt-3 flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-xs text-gray-700">
              Filtering by: <span className="font-semibold capitalize">{searchParams.status}</span>
            </span>
            <Link 
              href={`/products/${params.slug}/deployments/${deployment.id}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filter
            </Link>
          </div>
        )}
      </div>

      {/* Store onboarding grid */}
      {deployment.num_stores > 1 && (
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">🏪 Store Status</h3>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: deployment.num_stores }, (_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                Store {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task phases */}
      {phases.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium">No tasks match this filter</div>
          <div className="text-sm mt-1">Try selecting a different status or clear the filter</div>
        </div>
      ) : (
        phases.map(phase => {
          const phaseTasks = byPhase(phase!);
          const phaseDone = phaseTasks.filter(t => t.status === 'done').length;
          return (
            <section key={phase} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-bold text-gray-800">{phase}</h2>
                <span className="text-xs text-gray-400">{phaseDone}/{phaseTasks.length}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${phaseTasks.length ? (phaseDone / phaseTasks.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="card divide-y divide-gray-100">
                {phaseTasks.map(task => (
                  <DeploymentTaskRow key={task.id} task={task} product={product} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
    );
  } catch (err) {
    return <div className="p-8 text-center text-red-600">Error loading deployment details</div>;
  }
}
