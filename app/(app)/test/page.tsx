export const dynamic = 'force-dynamic';

export default async function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ Login & Redirect WORKS!</h1>
        
        <div className="bg-green-50 border border-green-300 rounded-lg p-6 mb-6">
          <p className="text-green-700 font-mono">
            If you&#39;re seeing this page, it means:
          </p>
          <ul className="text-green-700 mt-4 space-y-2 list-disc list-inside">
            <li>✅ You successfully logged in</li>
            <li>✅ The auth_token cookie was set</li>
            <li>✅ The middleware allowed you through</li>
            <li>✅ The page redirected you here</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-3">Next Steps:</h2>
          <ol className="text-blue-700 space-y-2 list-decimal list-inside">
            <li>The <strong>login/redirect flow is working perfectly</strong></li>
            <li>The dashboard page has errors loading database data</li>
            <li>We need to fix the dashboard database queries</li>
          </ol>
        </div>

        <p className="text-gray-600 mt-8">
          <strong>Current Time:</strong> {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}
