'use client';
import { useEffect, useState } from 'react';

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_by_name?: string;
  created_at: string;
}

interface Props {
  ticketId: string;
  currentUserId: string;
  onAttachmentAdded?: () => void;
}

export default function TicketAttachments({ ticketId, currentUserId, onAttachmentAdded }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [ticketId]);

  async function fetchAttachments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}/attachments`);
      if (!response.ok) throw new Error('Failed to fetch attachments');
      const data = await response.json();
      setAttachments(data.attachments || []);
    } catch (err) {
      console.error('[TicketAttachments] Error:', err);
      setError('Failed to load attachments');
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

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      await fetchAttachments();
      onAttachmentAdded?.();
      e.target.value = ''; // Reset input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (err) {
      setError('Failed to delete attachment');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-gray-900 mb-4">📎 Attachments</h3>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      {/* Upload Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">Max 10MB per file</p>
          </div>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && <p className="text-center text-sm text-blue-600 mt-2">Uploading...</p>}
      </div>

      {/* Attachments List */}
      {loading ? (
        <div className="text-center py-4 text-gray-400">Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">No attachments yet</div>
      ) : (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.file_path}
                  download
                  className="text-blue-600 hover:underline text-sm font-medium truncate block"
                  title={attachment.file_name}
                >
                  📄 {attachment.file_name}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                  {attachment.uploaded_by_name && ` • by ${attachment.uploaded_by_name}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(attachment.id)}
                className="ml-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm transition flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
