'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const LEAVE_TYPE_LABEL: Record<string, string> = {
  sick: '🤒 Sick',
  casual: '🎉 Casual',
  personal: '👤 Personal',
  urgent: '🚨 Urgent',
  annual: '🗓️ Annual',
};

function formatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function calculateDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

interface LeaveRowProps {
  leave: any;
  isPMOrManagement: boolean;
  currentUserId: string;
}

export default function LeaveRow({ leave, isPMOrManagement, currentUserId }: LeaveRowProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/leaves/${leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approval_notes: approvalNotes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to approve');
      router.refresh();
      setShowNotes(false);
    } catch (err) {
      alert('Failed to approve leave');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm('Reject this leave request?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/leaves/${leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          approval_notes: approvalNotes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to reject');
      router.refresh();
      setShowNotes(false);
    } catch (err) {
      alert('Failed to reject leave');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this leave request?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/leaves/${leave.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch (err) {
      alert('Failed to delete leave');
    } finally {
      setActionLoading(false);
    }
  }

  const days = calculateDays(leave.start_date, leave.end_date);
  const canEdit = leave.engineer_id === currentUserId && leave.status === 'pending';

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 font-medium text-gray-900">{leave.engineer_name}</td>
        <td className="px-4 py-3 text-sm">{LEAVE_TYPE_LABEL[leave.leave_type]}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(leave.start_date)}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(leave.end_date)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 font-semibold">{days} days</td>
        <td className="px-4 py-3 text-sm text-gray-600 line-clamp-1">{leave.reason || '—'}</td>
        <td className="px-4 py-3">
          <span className={clsx('badge text-xs', STATUS_CLS[leave.status])}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </span>
        </td>
        {isPMOrManagement && (
          <td className="px-4 py-3 flex gap-2">
            {leave.status === 'pending' && (
              <>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  disabled={actionLoading}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </>
            )}
            {leave.approved_by_name && (
              <span className="text-xs text-gray-500">Approved by {leave.approved_by_name}</span>
            )}
          </td>
        )}
        {!isPMOrManagement && canEdit && (
          <td className="px-4 py-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
            >
              🗑️ Delete
            </button>
          </td>
        )}
      </tr>
      {showNotes && leave.status === 'pending' && isPMOrManagement && (
        <tr className="bg-blue-50 border-b border-gray-100">
          <td colSpan={8} className="px-4 py-3">
            <div className="space-y-2">
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="Approval notes (optional)"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNotes(false)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
