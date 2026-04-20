'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Profile, Product } from '@/lib/types';
import clsx from 'clsx';

interface Props {
  profile: Profile | null;
  products: Product[];
}

const NAV = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/tickets',   label: 'Tickets',   icon: '🎫' },
  { href: '/daily',     label: 'Daily Logs', icon: '📋' },
];

export default function Sidebar({ profile, products }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-lg">🧠</div>
          <div>
            <div className="font-bold text-sm leading-tight">TNAI Project Hub</div>
            <div className="text-gray-400 text-xs">Thinkneural AI</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Products section */}
        <div className="pt-4 pb-1">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Products</div>
          {products.map(p => {
            const base = `/products/${p.slug}`;
            const active = pathname.startsWith(base);
            return (
              <div key={p.id}>
                <Link
                  href={`${base}/features`}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <span>{p.icon}</span>
                  <span className="flex-1">{p.name}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                </Link>
                {active && (
                  <div className="ml-8 mt-1 space-y-0.5 mb-1">
                    {[
                      ['features',     '⚡ Features'],
                      ['deployments',  '🚀 Deployments'],
                      ['dev-tasks',    '🔧 Dev Tasks'],
                      ['daily',        '📋 Daily Log'],
                    ].map(([seg, label]) => (
                      <Link
                        key={seg}
                        href={`${base}/${seg}`}
                        className={clsx(
                          'block px-3 py-1.5 rounded-md text-xs transition-colors',
                          pathname === `${base}/${seg}`
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin link (management only) */}
        {profile?.role === 'management' && (
          <Link
            href="/admin"
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-2',
              pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <span>⚙️</span> Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</div>
            <div className="text-gray-400 text-xs truncate">{profile?.role}</div>
          </div>
          <button onClick={signOut} title="Sign out"
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none">
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
