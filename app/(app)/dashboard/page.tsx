import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import EngineerDashboard from './EngineerDashboard';
import ManagementDashboard from './ManagementDashboard';

// Make this page dynamic
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/auth/login');

  try {
    const decoded = verifyToken(token);
    if (!decoded) redirect('/auth/login');

    // Get user profile to check role
    const profileResult = await query('SELECT * FROM profiles WHERE id = $1', [decoded.userId]);
    const profile = profileResult.rows[0];

    // If engineer, show engineer dashboard
    if (profile?.role === 'engineer') {
      return <EngineerDashboard userId={decoded.userId} userName={profile.full_name} />;
    }

    // Otherwise, show the management dashboard
    return <ManagementDashboard />;
  } catch (err) {
    console.error('Error loading dashboard:', err);
    redirect('/auth/login');
  }
}
