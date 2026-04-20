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
    // Load profile and products for sidebar
    const [profileResult, productsResult] = await Promise.all([
      query('SELECT * FROM profiles LIMIT 1'), // Get current user profile
      query('SELECT * FROM products ORDER BY name'),
    ]);

    const profile = profileResult.rows[0] || null;
    const products = productsResult.rows || [];

    console.log('[AppLayout] Loaded profile and', products.length, 'products');

    return (
      <div className="flex min-h-screen">
        <Sidebar profile={profile} products={products} />
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
