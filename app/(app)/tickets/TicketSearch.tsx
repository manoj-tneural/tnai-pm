'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function TicketSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    router.push(`/tickets?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <input
        type="text"
        placeholder="Search by ticket #, title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </form>
  );
}
