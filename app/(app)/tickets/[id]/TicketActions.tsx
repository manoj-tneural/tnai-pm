'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicket } from '@/app/actions/tickets';

interface Props {
  ticketId: string;
  currentStatus: string;
  currentAssignee: string | null;
  engineers: { id: string; full_name: string | null; role: string }[];
}

const STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'closed'];

export default function TicketActions({ ticketId, currentStatus, currentAssignee, engineers }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [assignee, setAssignee] = useState(currentAssignee ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setLoading(true);
    try {
      await updateTicket(ticketId, {
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

  return (
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
    </div>
  );
}
