'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function CommentBox({ ticketId, userId }: { ticketId: string; userId: string }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    await supabase.from('ticket_comments').insert({ ticket_id: ticketId, user_id: userId, comment: comment.trim() });
    setComment('');
    setLoading(false);
    router.refresh();
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
