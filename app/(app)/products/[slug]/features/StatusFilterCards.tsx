'use client';
import Link from 'next/link';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface Props {
  stats: {
    total: number;
    completed: number;
    in_progress: number;
    planned: number;
    testing: number;
  };
  selectedStatus?: string;
  productSlug: string;
}

export default function StatusFilterCards({ stats, selectedStatus, productSlug }: Props) {
  const statusCards = [
    { key: 'all', label: 'Total', value: stats.total, color: 'bg-gray-50 hover:bg-gray-100', icon: '📊' },
    { key: 'completed', label: 'Completed', value: stats.completed, color: 'bg-green-50 hover:bg-green-100 text-green-700', icon: '✅' },
    { key: 'in_progress', label: 'In Progress', value: stats.in_progress, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', icon: '⚡' },
    { key: 'planned', label: 'Planned', value: stats.planned, color: 'bg-gray-50 hover:bg-gray-100 text-gray-600', icon: '📅' },
    { key: 'testing', label: 'Testing', value: stats.testing, color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', icon: '🧪' },
  ];

  const getUrl = (statusKey: string) => {
    const baseUrl = `/products/${productSlug}/features`;
    return statusKey === 'all' ? baseUrl : `${baseUrl}?status=${statusKey === 'all' ? '' : statusKey}`;
  };

  const isSelected = (statusKey: string) => {
    if (statusKey === 'all') return !selectedStatus;
    return selectedStatus === statusKey;
  };

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {statusCards.map(s => (
        <Link key={s.key} href={getUrl(s.key)}>
          <div className={clsx(
            'card p-4 cursor-pointer transition-all',
            s.color,
            isSelected(s.key) && 'ring-2 ring-offset-2 ring-blue-500 shadow-lg'
          )}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-0.5 font-medium">{s.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
