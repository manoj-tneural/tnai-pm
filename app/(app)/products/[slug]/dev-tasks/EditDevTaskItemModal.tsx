'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditDevTaskItemModalProps {
  item: any;
  engineers: { id: string; full_name: string | null; role: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export default function EditDevTaskItemModal({ item, engineers, onClose, onSuccess }: EditDevTaskItemModalProps) {
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    planned_start_date: item.planned_start_date,
    planned_end_date: item.planned_end_date,
    dev_hours: item.dev_hours,
    status: item.status,
    assignee_id: item.assignee_id,
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadAttachments();
  }, []);

  async function loadAttachments() {
    try {
      setAttachmentsLoading(true);
      const response = await fetch(`/api/dev-task-item-attachments?item_id=${item.id}`);
      if (!response.ok) throw new Error('Failed to load attachments');
      const { attachments: loadedAttachments } = await response.json();
      setAttachments(loadedAttachments);
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`/api/dev-task-item-attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete attachment');
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (err) {
      alert('Failed to delete attachment');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter an item title');
      return;
    }

    setLoading(true);

    try {
      // Update the item
      const updateResponse = await fetch(`/api/dev-task-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          dev_hours: formData.dev_hours ? parseFloat(formData.dev_hours) : null,
          status: formData.status,
          assignee_id: formData.assignee_id || null,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update item');

      // Upload new file if provided
      if (newFile) {
        const formDataFile = new FormData();
        formDataFile.append('file', newFile);
        formDataFile.append('item_id', item.id);

        try {
          const uploadResponse = await fetch('/api/dev-task-item-attachments', {
            method: 'POST',
            body: formDataFile,
          });

          if (uploadResponse.ok) {
            const { attachment } = await uploadResponse.json();
            if (attachment) {
              setAttachments([attachment, ...attachments]);
              setNewFile(null);
            }
          } else {
            const errorData = await uploadResponse.json();
            console.error('File upload error:', errorData);
            setError(`File upload failed: ${errorData.error}`);
            return;
          }
        } catch (uploadErr) {
          console.error('Upload request error:', uploadErr);
          setError('File upload request failed');
          return;
        }
      }

      onSuccess();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter item title"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter description"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Planned Start Date
              </label>
              <input
                type="date"
                value={formData.planned_start_date || ''}
                onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Planned End Date
              </label>
              <input
                type="date"
                value={formData.planned_end_date || ''}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dev Hours
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.dev_hours || ''}
                onChange={(e) => setFormData({ ...formData, dev_hours: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
                <option value="testing">Testing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Assign To
            </label>
            <select
              value={formData.assignee_id || ''}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Unassigned</option>
              {engineers.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          {/* Attachments Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>

            {attachmentsLoading ? (
              <div className="text-xs text-gray-400">Loading attachments...</div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2 mb-4">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">📎</span>
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate"
                        title={attachment.file_name}
                      >
                        {attachment.file_name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 mb-4">No files uploaded yet</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Add New File
              </label>
              <input
                type="file"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              {newFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '✓ Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
