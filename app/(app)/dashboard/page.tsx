import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-jwt';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return <div className="p-8 text-red-600">No authentication token found</div>;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return <div className="p-8 text-red-600">Invalid authentication token</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to TNAI Platform</h1>
          <p className="text-gray-500 mt-2">Logged in as: <strong>{decoded.email}</strong></p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Your Profile</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Email:</strong> {decoded.email}</p>
            <p><strong>Role:</strong> {decoded.role}</p>
            <p><strong>User ID:</strong> {decoded.userId}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📱 Available Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/products" className="flex items-center p-4 border rounded-lg hover:bg-blue-50 transition">
              <span className="text-3xl mr-4">📦</span>
              <div>
                <h3 className="font-bold">Products</h3>
                <p className="text-sm text-gray-500">View all projects</p>
              </div>
            </Link>
            <Link href="/tickets" className="flex items-center p-4 border rounded-lg hover:bg-green-50 transition">
              <span className="text-3xl mr-4">🎫</span>
              <div>
                <h3 className="font-bold">Tickets</h3>
                <p className="text-sm text-gray-500">Manage issues</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex gap-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
