'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
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
  const [editForm, setEditForm] = useState({
    title: item.title,
    description: item.description,
    planned_start_date: item.planned_start_date,
    planned_end_date: item.planned_end_date,
    dev_hours: item.dev_hours,
    status: item.status,
    assignee_id: item.assignee_id,
  });
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

  async function handleUpdate() {
    try {
      const response = await fetch(`/api/dev-task-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update');
      const { item: updated } = await response.json();
      onUpdate(updated);
      setEditing(false);
      router.refresh();
    } catch (err) {
      alert('Failed to update item');
    }
  }

  if (editing) {
    return (
      <tr className="bg-blue-50 border-b border-gray-100">
        <td colSpan={8} className="px-4 py-3">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 font-semibold">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                placeholder="Item title"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold">Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                placeholder="Description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 font-semibold">Start Date</label>
                <input
                  type="date"
                  value={editForm.planned_start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, planned_start_date: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-semibold">End Date</label>
                <input
                  type="date"
                  value={editForm.planned_end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, planned_end_date: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-semibold">Dev Hours</label>
                <input
                  type="number"
                  value={editForm.dev_hours || ''}
                  onChange={(e) => setEditForm({ ...editForm, dev_hours: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 font-semibold">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-semibold">Assign To</label>
                <select
                  value={editForm.assignee_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, assignee_id: e.target.value || null })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                >
                  <option value="">Unassigned</option>
                  {engineers.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
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
    </tr>
  );
}
