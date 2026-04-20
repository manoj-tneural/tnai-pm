import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import clsx from 'clsx';

const STATUS_CLS: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  todo: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

export default async function DevTasksPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).single();
  if (!product) notFound();

  const { data: tasks } = await supabase
    .from('dev_tasks').select('*, assignee:assignee_id(full_name)')
    .eq('product_id', product.id).order('task_id');

  if ((tasks ?? []).length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/products/${params.slug}/features`} className="hover:text-blue-600">{product.name}</Link>
          <span>/</span>
          <span className="text-gray-800">Dev Tasks</span>
        </div>
        <h1 className="text-2xl font-bold mb-4">{product.icon} {product.name} — Dev Tasks</h1>
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🔧</div>
          <div>No backend dev tasks for this product yet.</div>
        </div>
      </div>
    );
  }

  const phases = [...new Set((tasks ?? []).map(t => t.phase).filter(Boolean))];
  const byPhase = (p: string) => (tasks ?? []).filter(t => t.phase === p);

  const done = (tasks ?? []).filter(t => t.status === 'done').length;
  const total = tasks?.length ?? 0;

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
      </div>

      {/* Progress */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: product.color }} />
          </div>
          <span className="text-sm font-bold" style={{ color: product.color }}>{total ? Math.round((done / total) * 100) : 0}%</span>
        </div>
      </div>

      {phases.map(phase => (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byPhase(phase!).map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.task_id}</td>
                    <td className="px-4 py-3">
                      <div className={clsx('font-medium', t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900')}>{t.sub_task}</div>
                      {t.description && <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', STATUS_CLS[t.status])}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.dev_hours ? `${t.dev_hours}h` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.planned_start ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.planned_end ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
