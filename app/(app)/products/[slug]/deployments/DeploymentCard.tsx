'use client';
import Link from 'next/link';
import { STATUS_COLORS } from '@/lib/types';
import clsx from 'clsx';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditDeploymentModal from './EditDeploymentModal';

export default function DeploymentCard({ deployment, productSlug }: { deployment: any; productSlug: string }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this deployment and all its tasks?')) return;
    
    try {
      const response = await fetch(`/api/deployments/${deployment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (err) {
      alert('Failed to delete deployment');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="card p-5 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-3">
          <Link href={`/products/${productSlug}/deployments/${deployment.id}`} className="flex-1">
            <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition">{deployment.customer_name}</div>
            {deployment.day0_date && <div className="text-xs text-gray-400 mt-0.5">Started: {deployment.day0_date}</div>}
          </Link>
          <div className="flex items-center gap-2">
            <span className={clsx('badge', STATUS_COLORS.deployment[deployment.status as keyof typeof STATUS_COLORS.deployment])}>
              {deployment.status.replace('_', ' ')}
            </span>
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
          </div>
        </div>
        {deployment.notes && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{deployment.notes}</p>}
        <Link href={`/products/${productSlug}/deployments/${deployment.id}`} className="flex items-center gap-4 text-xs text-gray-400">
          {deployment.num_stores > 0 && <span>🏪 {deployment.num_stores} {deployment.num_stores === 1 ? 'store' : 'stores'}</span>}
          {deployment.num_cameras > 0 && <span>📷 {deployment.num_cameras} cameras</span>}
          <span className="ml-auto text-blue-600 font-medium">View plan →</span>
        </Link>
      </div>
      {editing && <EditDeploymentModal deployment={deployment} onClose={() => setEditing(false)} />}
    </>
  );
}
