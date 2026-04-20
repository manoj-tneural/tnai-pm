'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addComment } from '@/app/actions/tickets';

export default function CommentBox({ ticketId, userId }: { ticketId: string; userId: string }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await addComment(ticketId, userId, comment);
      setComment('');
      router.refresh();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="textarea"
        rows={3}
        placeholder="Add a comment..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary" disabled={loading || !comment.trim()}>
        {loading ? 'Posting…' : 'Post Comment'}
      </button>
    </form>
  );
}
