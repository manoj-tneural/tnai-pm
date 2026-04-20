import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/types';
import clsx from 'clsx';
import RoleChanger from './RoleChanger';

const formatDate = (date: any): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date ? d.toISOString().split('T')[0] : String(date).split('T')[0];
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/auth/login');

  try {
    // Fetch current user
    const userResult = await query('SELECT * FROM profiles LIMIT 1');
    const user = userResult.rows[0];

    if (!user) redirect('/auth/login');
    if (user?.role !== 'management') redirect('/dashboard');

    // Fetch all users
    const usersResult = await query('SELECT * FROM profiles ORDER BY created_at DESC');
    const users: Array<any> = usersResult.rows;

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">⚙️ Admin — Team Management</h1>
        <p className="text-gray-500 text-sm mb-6">{users?.length ?? 0} registered users · Management access only</p>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold w-36">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold w-24">Joined</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(u.full_name ?? u.email)[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.full_name ?? '—'}</span>
                      {u.id === user?.id && <span className="text-xs text-blue-500">(you)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', ROLE_COLORS[u.role as keyof typeof ROLE_COLORS])}>
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user?.id && <RoleChanger userId={u.id} currentRole={u.role} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[AdminPage] Error:', error);
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error Loading Admin Page</h1>
        <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      </div>
    );
  }
}
