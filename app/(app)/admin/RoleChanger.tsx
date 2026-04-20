'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/types';

export default function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function change(newRole: string) {
    setRole(newRole);
    setLoading(true);
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={role}
      onChange={e => change(e.target.value)}
      disabled={loading}
    >
      {Object.entries(ROLE_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
