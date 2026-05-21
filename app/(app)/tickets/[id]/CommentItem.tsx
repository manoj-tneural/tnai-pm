'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommentItemProps {
  comment: {
    id: string;
    comment: string;
    full_name: string | null;
    role: string;
    created_at: string;
    user_id: string;
  };
  currentUserId: string;
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CommentItem({ comment, currentUserId }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isOwner = comment.user_id === currentUserId;

  async function handleEdit() {
    if (!editText.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ticket-comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editText }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update comment');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment? This cannot be undone.')) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ticket-comments/${comment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete comment');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {(comment.full_name ?? 'U')[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">{comment.full_name}</span>
          <span className="text-gray-400 text-xs">{comment.role}</span>
          <span className="text-gray-400 text-xs">{formatDate(comment.created_at)}</span>
          {isOwner && (
            <span className="text-gray-400 text-xs ml-auto">
              {isEditing ? (
                <span>Editing</span>
              ) : (
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </span>
          )}
        </div>
        
        {error && (
          <div className="text-red-600 text-xs mb-2">{error}</div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.comment);
                  setError('');
                }}
                disabled={loading}
                className="text-xs bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{comment.comment}</p>
        )}
      </div>
    </div>
  );
}
