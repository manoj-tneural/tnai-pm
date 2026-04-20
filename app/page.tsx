import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (token && verifyToken(token)) {
    redirect('/dashboard');
  }
  redirect('/auth/login');
}
