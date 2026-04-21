'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditDailyLogModal from './EditDailyLogModal';

export default function DailyLogCard({ log, currentUserId }: { log: any; currentUserId: string }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const isOwnLog = log.user_id === currentUserId;

  async function handleDelete() {
    if (!confirm('Delete this log?')) return;
    
    try {
      const response = await fetch(`/api/daily-logs/${log.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (err) {
      alert('Failed to delete log');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {(log.full_name ?? 'U')[0].toUpperCase()}
            </div>
            <span className="font-medium text-sm text-gray-900">{log.full_name ?? 'Unknown'}</span>
            <span className="text-xs text-gray-400">{log.role}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOwnLog && <span className="text-xs text-blue-600">Your log</span>}
            {isOwnLog && (
              <>
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
              </>
            )}
          </div>
        </div>
        <div className="ml-9 space-y-2">
          {log.yesterday && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Yesterday</span>
              <p className="text-sm text-gray-700 mt-0.5">{log.yesterday}</p>
            </div>
          )}
          {log.today && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today</span>
              <p className="text-sm text-gray-700 mt-0.5">{log.today}</p>
            </div>
          )}
          {log.blockers && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">🚧 Blockers</span>
              <p className="text-sm text-red-700 mt-0.5">{log.blockers}</p>
            </div>
          )}
        </div>
      </div>
      {editing && <EditDailyLogModal log={log} onClose={() => setEditing(false)} />}
    </>
  );
}
