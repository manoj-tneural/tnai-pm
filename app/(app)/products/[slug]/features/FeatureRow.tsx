'use client';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditFeatureModal from './EditFeatureModal';

export default function FeatureRow({ feature }: { feature: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this feature?')) return;
    
    try {
      const response = await fetch(`/api/features/${feature.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (err) {
      alert('Failed to delete feature');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{feature.feature_id}</td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{feature.name}</div>
          {feature.notes && <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{feature.notes}</div>}
        </td>
        <td className="px-4 py-3">
          <span className={clsx('badge', STATUS_COLORS.feature[feature.status as keyof typeof STATUS_COLORS.feature])}>
            {feature.status.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600">{feature.dev_hours ?? '—'}</td>
        <td className="px-4 py-3">
          {feature.llm_based ? <span className="badge bg-purple-100 text-purple-700">LLM</span> : <span className="text-gray-300">—</span>}
        </td>
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
      {editing && <EditFeatureModal feature={feature} onClose={() => setEditing(false)} />}
    </>
  );
}
