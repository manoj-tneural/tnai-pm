'use client';
import { useState, useEffect } from 'react';

interface HistoryEntry {
  id: string;
  action: string;
  field_name: string;
  old_value: string;
  new_value: string;
  description: string;
  full_name: string;
  role: string;
  created_at: string;
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function TicketHistory({ ticketId }: { ticketId: string }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        console.log('[TicketHistory] Fetching history for ticket:', ticketId);
        const response = await fetch(`/api/tickets/${ticketId}/history`);
        console.log('[TicketHistory] Response status:', response.status);
        
        if (!response.ok) {
          console.error(`[TicketHistory] API error: ${response.status} ${response.statusText}`);
          // Don't show error, just show empty history
          setHistory([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('[TicketHistory] Received data:', data);
        setHistory(data.history || []);
      } catch (err) {
        console.error('[TicketHistory] Failed to fetch history:', err);
        // Gracefully handle error - show empty history
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [ticketId]);

  if (loading) return <div className="text-gray-500">Loading history...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;
  if (history.length === 0) return <div className="text-gray-400 text-sm italic">No changes recorded yet.</div>;

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-gray-900">
                {entry.full_name || 'Unknown User'}
                <span className="text-gray-500 text-xs ml-2">({entry.role})</span>
              </div>
              <div className="text-gray-700 mt-1">
                {entry.description || `${entry.field_name} was updated`}
              </div>
              {entry.old_value && entry.new_value && (
                <div className="text-gray-600 mt-1 text-xs space-y-0.5">
                  <div><span className="text-gray-500">Before:</span> <span className="line-through">{entry.old_value}</span></div>
                  <div><span className="text-gray-500">After:</span> <span className="font-medium">{entry.new_value}</span></div>
                </div>
              )}
            </div>
            <div className="text-gray-400 text-xs whitespace-nowrap ml-2">
              {formatDate(entry.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
