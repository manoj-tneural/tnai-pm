'use client';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditFeatureModal from './EditFeatureModal';

function formatDate(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
}

function getDaysUntilEndDate(endDate: any): number | null {
  if (!endDate) return null;
  
  const date = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getRowColor(endDate: any, status: string): string {
  // Skip coloring if feature is completed
  if (status === 'completed') return '';
  
  const daysUntil = getDaysUntilEndDate(endDate);
  
  if (daysUntil === null) return '';
  if (daysUntil < 0) return 'bg-red-50'; // Past due
  if (daysUntil <= 2) return 'bg-yellow-50'; // Due in 2 days or less
  return '';
}

export default function FeatureRow({ feature, engineers }: { feature: any; engineers: { id: string; full_name: string | null; role: string }[] }) {
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

  const assignedEngineers = feature.assigned_to
    ? engineers.filter(e => feature.assigned_to.includes(e.id))
    : [];

  return (
    <>
      <tr className={clsx('hover:bg-opacity-75 transition-colors', getRowColor(feature.end_date, feature.status))}>
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
        <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(feature.start_date) || '—'}</td>
        <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(feature.end_date) || '—'}</td>
        <td className="px-4 py-3 text-gray-600">{feature.dev_hours ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600 text-sm">{feature.accuracy !== null && feature.accuracy !== undefined ? `${parseFloat(feature.accuracy).toFixed(1)}%` : '—'}</td>
        <td className="px-4 py-3">
          {feature.llm_based ? <span className="badge bg-purple-100 text-purple-700">LLM</span> : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3">
          <div className="text-xs max-w-xs">
            {assignedEngineers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {assignedEngineers.map(eng => (
                  <span key={eng.id} className="badge bg-blue-100 text-blue-700 whitespace-nowrap">
                    {eng.full_name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-300">Unassigned</span>
            )}
          </div>
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
      {editing && <EditFeatureModal feature={feature} onClose={() => setEditing(false)} engineers={engineers} />}
    </>
  );
}
