'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { STATUS_COLORS } from '@/lib/types';
import EditTicketModal from './EditTicketModal';

const TYPE_ICON: Record<string, string> = { bug: '🐛', feature: '✨', improvement: '⚡', task: '📋', question: '❓' };
const PRIORITY_ICON: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

function formatDate(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

export default function TicketRow({ ticket }: { ticket: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this ticket and all its comments?')) return;
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.refresh();
    } catch (err) {
      alert('Failed to delete ticket');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm">
          <Link href={`/tickets/${ticket.id}`} className="font-medium text-gray-900 hover:text-blue-600">
            {TYPE_ICON[ticket.type]} {ticket.title}
          </Link>
          {ticket.description && <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{ticket.description}</div>}
        </td>
        <td className="px-4 py-3">
          <span className={clsx('badge', STATUS_COLORS.priority[ticket.priority as keyof typeof STATUS_COLORS.priority])}>
            {PRIORITY_ICON[ticket.priority]} {ticket.priority}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={clsx('badge', STATUS_COLORS.ticket[ticket.status as keyof typeof STATUS_COLORS.ticket])}>
            {ticket.status.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600 text-sm">{ticket.product_name ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600 text-sm">
          {ticket.assignee_full_name ? <span>{ticket.assignee_full_name}</span> : <span className="text-gray-300">Unassigned</span>}
        </td>
        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(ticket.created_at)}</td>
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
      {editing && <EditTicketModal ticket={ticket} onClose={() => setEditing(false)} />}
    </>
  );
}
