'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS } from '@/lib/types';

export default function RoleChanger({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function change(newRole: string) {
    // Optimistic UI update
    setRole(newRole);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update role:', errorData);
        setRole(currentRole); // Revert on error
        alert(errorData.error || 'Failed to update role');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Error:', err);
      setRole(currentRole); // Revert on error
      alert('Failed to update role');
    } finally {
      setLoading(false);
    }
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
