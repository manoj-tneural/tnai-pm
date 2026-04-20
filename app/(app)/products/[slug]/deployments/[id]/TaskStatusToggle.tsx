'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import clsx from 'clsx';

const CYCLE: Record<string, string> = { todo: 'ongoing', ongoing: 'done', done: 'blocked', blocked: 'todo' };
const ICONS: Record<string, string> = { done: '✅', ongoing: '🔄', todo: '⬜', blocked: '🚫' };

export default function TaskStatusToggle({ taskId, status }: { taskId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    const next = CYCLE[current] ?? 'todo';
    setLoading(true);
    await supabase.from('deployment_tasks').update({ status: next }).eq('id', taskId);
    setCurrent(next);
    setLoading(false);
    router.refresh();
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
