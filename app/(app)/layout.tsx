import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/auth/login');

  const decoded = verifyToken(token);
  if (!decoded) redirect('/auth/login');

  try {
    const [profileResult, productsResult] = await Promise.all([
      query('SELECT * FROM profiles WHERE id = $1', [decoded.userId]),
      query('SELECT * FROM products ORDER BY name'),
    ]);

    const profile = profileResult.rows[0];
    const products: Array<any> = productsResult.rows;

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
