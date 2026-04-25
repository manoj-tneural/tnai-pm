import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import clsx from 'clsx';
import NewDevTaskButton from './NewDevTaskButton';
import DevTaskRow from './DevTaskRow';
import DevTaskStatusFilter from './DevTaskStatusFilter';

const STATUS_CLS: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  todo: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

export default async function DevTasksPage({ params, searchParams }: { params: { slug: string }; searchParams: { status?: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  try {
    const productResult = await query('SELECT * FROM products WHERE slug = $1', [params.slug]);
    const product = productResult.rows[0];
    if (!product) notFound();

    const tasksResult = await query(
      `SELECT dt.*, p.full_name as assignee_full_name 
       FROM dev_tasks dt
       LEFT JOIN profiles p ON dt.assignee_id = p.id
       WHERE dt.product_id = $1 
       ORDER BY dt.task_id`,
      [product.id]
    );
    const allTasks: Array<any> = tasksResult.rows;
    
    // Filter by status if provided
    const selectedStatus = searchParams.status;
    const tasks: Array<any> = selectedStatus
      ? allTasks.filter((t: any) => t.status === selectedStatus)
      : allTasks;

    const stats = {
      total: allTasks?.length ?? 0,
      todo: allTasks?.filter((t: any) => t.status === 'todo').length ?? 0,
      in_progress: allTasks?.filter((t: any) => t.status === 'in_progress').length ?? 0,
      done: allTasks?.filter((t: any) => t.status === 'done').length ?? 0,
      blocked: allTasks?.filter((t: any) => t.status === 'blocked').length ?? 0,
    };

    if ((allTasks ?? []).length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/products/${params.slug}/features`} className="hover:text-blue-600">{product.name}</Link>
          <span>/</span>
          <span className="text-gray-800">Dev Tasks</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{product.icon} {product.name} — Backend Dev Tasks</h1>
          <NewDevTaskButton productId={product.id} />
        </div>
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🔧</div>
          <div>No backend dev tasks for this product yet.</div>
        </div>
      </div>
    );
  }

  const phases = [...new Set((tasks ?? []).map(t => t.phase).filter(Boolean))];
  const byPhase = (p: string) => (tasks ?? []).filter(t => t.phase === p);

  const done = stats.done;
  const total = stats.total;

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/products/${params.slug}/features`} className="hover:text-blue-600">{product.name}</Link>
          <span>/</span>
          <span className="text-gray-800">Dev Tasks</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{product.icon} {product.name} — Backend Dev Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">{done}/{total} tasks completed</p>
          </div>
          <NewDevTaskButton productId={product.id} />
        </div>
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: product.color }} />
          </div>
          <span className="text-sm font-bold" style={{ color: product.color }}>{total ? Math.round((done / total) * 100) : 0}%</span>
        </div>
      </div>

      {/* Status Filter Cards */}
      <DevTaskStatusFilter stats={stats} selectedStatus={selectedStatus} productSlug={params.slug} />

      {/* Active Filter Indicator */}
      {selectedStatus && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-blue-700">
            Showing <span className="font-semibold">{selectedStatus.replace('_', ' ')}</span> tasks ({tasks.length} of {allTasks.length})
          </div>
          <Link href={`/products/${params.slug}/dev-tasks`} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">
            Clear Filter
          </Link>
        </div>
      )}

      {phases.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <div>No dev tasks found {selectedStatus ? `with status "${selectedStatus.replace('_', ' ')}"` : ''}.</div>
        </div>
      ) : (
        <section key={phase} className="mb-8">
          <h2 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full" style={{ backgroundColor: product.color }} />
            {phase}
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-16">Task</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Sub-Task</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-28">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-16">Hours</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Start</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">End</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byPhase(phase!).map(t => (
                  <DevTaskRow key={t.id} task={t} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
        ))
      )}
    </div>
    );
  } catch (err) {
    console.error('Error loading dev tasks:', err);
    return <div className="p-8 text-red-600">Error loading dev tasks</div>;
  }
}
