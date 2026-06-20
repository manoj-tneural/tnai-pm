'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DevTaskItemRow from './DevTaskItemRow';

interface DevTaskItemsDisplayProps {
  taskId: string;
  items: any[];
  engineers: { id: string; full_name: string | null; role: string }[];
  onItemsChange: () => void;
}

export default function DevTaskItemsDisplay({ taskId, items, engineers, onItemsChange }: DevTaskItemsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    planned_start_date: '',
    planned_end_date: '',
    dev_hours: '',
    status: 'todo',
    assignee_id: '',
  });
  const router = useRouter();

  async function handleAddItem() {
    if (!formData.title.trim()) {
      alert('Please enter an item title');
      return;
    }

    try {
      const response = await fetch('/api/dev-task-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          title: formData.title,
          description: formData.description || null,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          dev_hours: formData.dev_hours ? parseFloat(formData.dev_hours) : null,
          status: formData.status,
          assignee_id: formData.assignee_id || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create item');

      setFormData({
        title: '',
        description: '',
        planned_start_date: '',
        planned_end_date: '',
        dev_hours: '',
        status: 'todo',
        assignee_id: '',
      });
      setIsAddingItem(false);
      onItemsChange();
      router.refresh();
    } catch (err) {
      alert('Failed to create item');
    }
  }

  return (
    <div className="border-l-2 border-gray-200 ml-4 pl-4 py-2">
      {/* Header with toggle */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition mb-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs text-gray-600 font-semibold">
          {isOpen ? '▼' : '▶'} Sub-Items ({items.length})
        </span>
      </div>

      {/* Items List */}
      {isOpen && (
        <div className="space-y-0 mb-3">
          {items.length === 0 ? (
            <div className="text-xs text-gray-400 py-2 italic">No items yet</div>
          ) : (
            items.map(item => (
              <DevTaskItemRow
                key={item.id}
                item={item}
                engineers={engineers}
                onDelete={onItemsChange}
                onUpdate={onItemsChange}
              />
            ))
          )}

          {/* Add Item Form */}
          {isAddingItem && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-xs text-gray-600 font-semibold">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    placeholder="Item title"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-semibold">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    placeholder="Description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Start Date</label>
                    <input
                      type="date"
                      value={formData.planned_start_date}
                      onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">End Date</label>
                    <input
                      type="date"
                      value={formData.planned_end_date}
                      onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Dev Hours</label>
                    <input
                      type="number"
                      value={formData.dev_hours}
                      onChange={(e) => setFormData({ ...formData, dev_hours: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-semibold">Assign To</label>
                    <select
                      value={formData.assignee_id}
                      onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-0.5"
                    >
                      <option value="">Unassigned</option>
                      {engineers.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setIsAddingItem(false)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Item Button */}
          {isOpen && !isAddingItem && (
            <button
              onClick={() => setIsAddingItem(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2 transition"
            >
              + Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
