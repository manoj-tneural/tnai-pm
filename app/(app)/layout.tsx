import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  
  // Check for auth_token (set by login route)
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    console.log('[AppLayout] No auth_token found, redirecting to login');
    redirect('/auth/login');
  }

  console.log('[AppLayout] Token found, user authenticated');

  try {
    // For now, just return children without querying profile/products
    // This lets us debug the dashboard separately
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    console.error('Failed to load app layout:', error);
    redirect('/auth/login');
  }
}
