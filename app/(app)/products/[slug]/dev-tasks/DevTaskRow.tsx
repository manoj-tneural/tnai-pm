'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import EditDevTaskModal from './EditDevTaskModal';

const STATUS_CLS: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  todo: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

function formatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'string') return date;
  return new Date(date).toISOString().split('T')[0];
}

export default function DevTaskRow({ task }: { task: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    
    try {
      const response = await fetch(`/api/dev-tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (err) {
      alert('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{task.task_id}</td>
        <td className="px-4 py-3">
          <div className={clsx('font-medium', task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900')}>{task.sub_task}</div>
          {task.description && <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">{task.description}</div>}
        </td>
        <td className="px-4 py-3">
          <span className={clsx('badge', STATUS_CLS[task.status])}>{task.status.replace('_', ' ')}</span>
        </td>
        <td className="px-4 py-3 text-gray-500">{task.dev_hours ? `${task.dev_hours}h` : '—'}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(task.planned_start)}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(task.planned_end)}</td>
        <td className="px-4 py-3 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
            title="Delete"
          >
            🗑️
          </button>
        </td>
      </tr>
      {editing && <EditDevTaskModal task={task} onClose={() => setEditing(false)} />}
    </>
  );
}
