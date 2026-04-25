'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const CYCLE: Record<string, string> = { todo: 'ongoing', ongoing: 'done', done: 'blocked', blocked: 'todo' };
const ICONS: Record<string, string> = { done: '✅', ongoing: '🔄', todo: '⬜', blocked: '🚫' };

export default function TaskStatusToggle({ taskId, status }: { taskId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    const next = CYCLE[current] ?? 'todo';
    setLoading(true);

    try {
      const response = await fetch(`/api/deployment-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      setCurrent(next);
      router.refresh();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={`Status: ${current}. Click to advance.`}
      className={clsx('text-xl leading-none flex-shrink-0 mt-0.5 hover:scale-110 transition-transform', loading && 'opacity-50')}
    >
      {ICONS[current] ?? '⬜'}
    </button>
  );
}
