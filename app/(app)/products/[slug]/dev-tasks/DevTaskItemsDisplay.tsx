'use client';
import { useState } from 'react';
import DevTaskItemRow from './DevTaskItemRow';
import NewDevTaskItemModal from './NewDevTaskItemModal';

interface DevTaskItemsDisplayProps {
  taskId: string;
  items: any[];
  engineers: { id: string; full_name: string | null; role: string }[];
  onItemsChange: () => void;
  initialOpen?: boolean;
}

export default function DevTaskItemsDisplay({ taskId, items, engineers, onItemsChange, initialOpen = false }: DevTaskItemsDisplayProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
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

            {/* Add Item Button */}
            {isOpen && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2 transition"
              >
                + Add Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <NewDevTaskItemModal
          taskId={taskId}
          engineers={engineers}
          onClose={() => setShowAddModal(false)}
          onSuccess={onItemsChange}
        />
      )}
    </>
  );
}
