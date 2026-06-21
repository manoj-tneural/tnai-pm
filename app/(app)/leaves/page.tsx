import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import NewLeaveButton from './NewLeaveButton';
import LeaveRow from './LeaveRow';

function formatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

export default async function LeavesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  try {
    const decoded = verifyToken(token);
    if (!decoded) redirect('/auth/login');

    const [profileResult, leavesResult] = await Promise.all([
      query('SELECT * FROM profiles WHERE id = $1', [decoded.userId]),
      query(
        `SELECT l.*, p.full_name as engineer_name, ap.full_name as approved_by_name
         FROM leaves l
         JOIN profiles p ON l.engineer_id = p.id
         LEFT JOIN profiles ap ON l.approved_by = ap.id
         ORDER BY l.start_date DESC`
      ),
    ]);

    const profile = profileResult.rows[0];
    const allLeaves = leavesResult.rows;

    // Filter leaves based on role
    const leaves = profile?.role === 'management' || profile?.role === 'pm'
      ? allLeaves
      : allLeaves.filter((l: any) => l.engineer_id === decoded.userId);

    const stats = {
      total: leaves.length,
      pending: leaves.filter((l: any) => l.status === 'pending').length,
      approved: leaves.filter((l: any) => l.status === 'approved').length,
      rejected: leaves.filter((l: any) => l.status === 'rejected').length,
    };

    const isPMOrManagement = profile?.role === 'management' || profile?.role === 'pm';

    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-800">Leaves</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🏖️ Leaves</h1>
            <p className="text-gray-500 text-sm mt-1">{stats.approved}/{stats.total} approved</p>
          </div>
          {!isPMOrManagement && <NewLeaveButton userId={decoded.userId} />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total Leaves</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-gray-500 mt-1">Approved</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500 mt-1">Rejected</div>
          </div>
        </div>

        {/* Leaves Table */}
        {leaves.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div>No leave requests yet.</div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Engineer</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Start</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">End</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Days</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Reason</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                  {isPMOrManagement && <th className="text-left px-4 py-3 text-gray-600 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((leave: any) => (
                  <LeaveRow
                    key={leave.id}
                    leave={leave}
                    isPMOrManagement={isPMOrManagement}
                    currentUserId={decoded.userId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error('Error loading leaves page:', err);
    return <div className="p-8 text-red-600">Error loading leaves</div>;
  }
}
