'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import EditDevTaskItemModal from './EditDevTaskItemModal';
import { STATUS_COLORS } from '@/lib/types';

const STATUS_ICON: Record<string, string> = {
  done: '✓',
  in_progress: '⟳',
  todo: '○',
  blocked: '✕',
  testing: '🧪',
};

function formatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

interface DevTaskItemRowProps {
  item: any;
  engineers: { id: string; full_name: string | null; role: string }[];
  onDelete: () => void;
  onUpdate: (updates: any) => void;
}

export default function DevTaskItemRow({ item, engineers, onDelete, onUpdate }: DevTaskItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/dev-task-items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to delete');
      onDelete();
      router.refresh();
    } catch (err) {
      alert('Failed to delete item');
      setDeleting(false);
    }
  }

  return (
    <tr className="bg-gray-25 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td colSpan={2} className="px-4 py-2 text-sm">
        <div className="ml-8">
          <div className="font-medium text-gray-800">{item.title}</div>
          {item.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>}
        </div>
      </td>
      <td className="px-4 py-2">
        <span className={clsx('badge text-xs', STATUS_COLORS.ticket[item.status as keyof typeof STATUS_COLORS.ticket])}>
          {STATUS_ICON[item.status]} {item.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-2 text-xs text-gray-600 text-center">{item.dev_hours ? `${item.dev_hours}h` : '—'}</td>
      <td className="px-4 py-2 text-xs text-gray-500">{formatDate(item.planned_start_date)}</td>
      <td className="px-4 py-2 text-xs text-gray-500">{formatDate(item.planned_end_date)}</td>
      <td className="px-4 py-2 text-xs text-gray-600">{item.assignee_full_name || 'Unassigned'}</td>
      <td className="px-4 py-2 flex gap-1">
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
      </td>
      {editing && (
        <EditDevTaskItemModal
          item={item}
          engineers={engineers}
          onClose={() => setEditing(false)}
          onSuccess={() => onUpdate(item)}
        />
      )}
    </tr>
  );
}
