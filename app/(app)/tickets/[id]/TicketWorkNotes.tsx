'use client';
import { useState, useEffect } from 'react';

interface WorkNote {
  id: string;
  ticket_id: string;
  user_id: string;
  work_note: string;
  full_name?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  ticketId: string;
  currentUserId: string;
}

export default function TicketWorkNotes({ ticketId, currentUserId }: Props) {
  const [workNotes, setWorkNotes] = useState<WorkNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchWorkNotes();
  }, [ticketId]);

  async function fetchWorkNotes() {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}/work-notes`);
      if (!response.ok) throw new Error('Failed to fetch work notes');
      const data = await response.json();
      setWorkNotes(data.workNotes || []);
    } catch (err) {
      console.error('[TicketWorkNotes] Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/tickets/${ticketId}/work-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_note: newNote }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add work note');
      }

      setNewNote('');
      await fetchWorkNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add work note');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(noteId: string) {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}/work-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_note: editText }),
      });

      if (!response.ok) throw new Error('Failed to update work note');

      setEditingId(null);
      setEditText('');
      await fetchWorkNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work note');
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Delete this work note?')) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}/work-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete work note');
      await fetchWorkNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work note');
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-gray-900 mb-4">🛠️ Work Notes</h3>
      <p className="text-xs text-gray-500 mb-4">Technical details about fixes, solutions, and implementation notes</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      {/* Add Work Note Form */}
      <form onSubmit={handleSubmit} className="mb-6 pb-6 border-b">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add technical details about the fix, solution, or implementation..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />
        <button
          type="submit"
          disabled={submitting || !newNote.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
        >
          {submitting ? 'Saving...' : 'Add Work Note'}
        </button>
      </form>

      {/* Work Notes List */}
      {loading ? (
        <div className="text-center py-4 text-gray-400">Loading work notes...</div>
      ) : workNotes.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">No work notes yet</div>
      ) : (
        <div className="space-y-4">
          {workNotes.map((note) => (
            <div key={note.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(note.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800 whitespace-pre-wrap mb-3">{note.work_note}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">{note.full_name}</span>
                      {note.role && <span className="ml-2 text-gray-400">({note.role})</span>}
                      <span className="ml-2">{formatDate(note.created_at)}</span>
                    </div>
                    {note.user_id === currentUserId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditText(note.work_note);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
