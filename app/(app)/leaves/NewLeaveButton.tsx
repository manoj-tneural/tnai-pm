'use client';
import { useState } from 'react';
import NewLeaveModal from './NewLeaveModal';

interface NewLeaveButtonProps {
  userId: string;
}

export default function NewLeaveButton({ userId }: NewLeaveButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
      >
        + Request Leave
      </button>
      {showModal && <NewLeaveModal userId={userId} onClose={() => setShowModal(false)} />}
    </>
  );
}
