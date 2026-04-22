'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import TaskStatusToggle from './TaskStatusToggle';
import EditDeploymentTaskModal from './EditDeploymentTaskModal';

export default function DeploymentTaskRow({ task, product }: { task: any; product: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/deployment-tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.refresh();
    } catch (error) {
      alert('Failed to delete task');
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
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
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      {editing && <EditDeploymentTaskModal task={task} onClose={() => setEditing(false)} />}
    </>
  );
}
