'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicket } from '@/app/actions/tickets';
import EditTicketModal from '../EditTicketModal';

interface Props {
  ticket: any;
  currentStatus: string;
  currentAssignee: string | null;
  engineers: { id: string; full_name: string | null; role: string }[];
}

const STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'closed'];

export default function TicketActions({ ticket, currentStatus, currentAssignee, engineers }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [assignee, setAssignee] = useState(currentAssignee ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function save() {
    setLoading(true);
    try {
      await updateTicket(ticket.id, {
        status: status !== currentStatus ? status : undefined,
        assignee_id: assignee !== (currentAssignee ?? '') ? assignee || null : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this ticket and all its comments?')) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.push('/tickets');
    } catch (err) {
      alert('Failed to delete ticket');
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-4">Actions</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Status</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign To</label>
            <select className="select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>)}
            </select>
          </div>
          <button onClick={save} className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Saving…' : saved ? '✅ Saved' : 'Update Ticket'}
          </button>
        </div>

        {/* Edit & Delete buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-sm font-medium"
          >
            ✏️ Edit Details
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-medium disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>

      {editing && <EditTicketModal ticket={ticket} onClose={() => setEditing(false)} />}
    </>
  );
}
