import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import TaskStatusToggle from './TaskStatusToggle';

export default async function DeploymentDetailPage({ params }: { params: { slug: string; id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  const decoded = verifyToken(token);
  if (!decoded) redirect('/auth/login');

  try {
    const [productResult, deploymentResult, tasksResult] = await Promise.all([
      query('SELECT * FROM products WHERE slug = $1', [params.slug]),
      query('SELECT * FROM deployments WHERE id = $1', [params.id]),
      query('SELECT * FROM deployment_tasks WHERE deployment_id = $1 ORDER BY sort_order', [params.id]),
    ]);

    const product = productResult.rows[0];
    const deployment = deploymentResult.rows[0];
    const tasks: Array<any> = tasksResult.rows;

    if (!product || !deployment) notFound();

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
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> {(tasks ?? []).filter(t => t.status === 'done').length} Done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> {(tasks ?? []).filter(t => t.status === 'ongoing').length} Ongoing</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full" /> {(tasks ?? []).filter(t => t.status === 'todo').length} Todo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> {(tasks ?? []).filter(t => t.status === 'blocked').length} Blocked</span>
        </div>
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
      {phases.map(phase => {
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
                <div key={task.id} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <TaskStatusToggle taskId={task.id} status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono w-6">{task.task_no}</span>
                      <span className={clsx('text-sm font-medium', task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800')}>
                        {task.task_desc}
                      </span>
                    </div>
                    {task.remarks && <p className="text-xs text-gray-400 mt-0.5 ml-8">{task.remarks}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.owner && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.owner}</span>}
                    <span className={clsx('badge text-xs', STATUS_COLORS.task[task.status as keyof typeof STATUS_COLORS.task])}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
    );
  } catch (err) {
    return <div className="p-8 text-center text-red-600">Error loading deployment details</div>;
  }
}
