'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  ticket: any;
  onClose: () => void;
  products: { id: string; name: string; icon: string }[];
  engineers: { id: string; full_name: string | null; role: string }[];
}

function formatDateForInput(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
}

export default function EditTicketModal({ ticket, onClose, products, engineers }: Props) {
  const [formData, setFormData] = useState({
    title: ticket.title || '',
    description: ticket.description || '',
    type: ticket.type || 'task',
    priority: ticket.priority || 'medium',
    product_id: ticket.product_id || '',
    assignee_id: ticket.assignee_id || '',
    due_date: formatDateForInput(ticket.due_date),
    actual_end_date: formatDateForInput(ticket.actual_end_date),
    status: ticket.status || 'open',
    ticket_source: ticket.ticket_source || 'internal',
    customer_name: ticket.customer_name || '',
    tested_by: ticket.tested_by || '',
    tested_date: formatDateForInput(ticket.tested_date),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update ticket');
      }
      
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validation
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);
    setError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      setUploadSuccess(`✓ ${file.name} uploaded`);
      e.target.value = ''; // Reset input
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-bold mb-4">Edit Ticket</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4" style={{ overflow: 'scroll', maxHeight: '500px' }}>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bug">🐛 Bug</option>
                <option value="change_request">📝 Change Request</option>
                <option value="feature_enhancement">✨ Feature Enhancement</option>
                <option value="incident">🚨 Incident</option>
                <option value="service_request">🔧 Service Request</option>
                <option value="task">📋 Task</option>
                <option value="new_feature_request">🎯 New Feature Request</option>
                <option value="problem">⚠️ Problem</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>critical</option>
                <option>high</option>
                <option>medium</option>
                <option>low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="closed">closed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Actual End Date</label>
            <input
              type="date"
              value={formData.actual_end_date}
              onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {engineers.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ticket Type</label>
              <select
                value={formData.ticket_source}
                onChange={(e) => setFormData({ ...formData, ticket_source: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="internal">🏢 Internal</option>
                <option value="external">👥 External</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tested By</label>
              <select
                value={formData.tested_by}
                onChange={(e) => setFormData({ ...formData, tested_by: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Tested</option>
                {engineers.map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>
                ))}
              </select>
            </div>
          </div>

          {formData.ticket_source === 'external' && (
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Testing Date</label>
            <input
              type="date"
              value={formData.tested_date}
              onChange={(e) => setFormData({ ...formData, tested_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium mb-2">📎 Attach File</label>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="w-full text-sm"
            />
            {uploadSuccess && <p className="text-green-600 text-sm mt-2">{uploadSuccess}</p>}
            {uploadingFile && <p className="text-blue-600 text-sm mt-2">Uploading...</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
