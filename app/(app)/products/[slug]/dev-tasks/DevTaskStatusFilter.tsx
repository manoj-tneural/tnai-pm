'use client';
import Link from 'next/link';
import clsx from 'clsx';

interface Props {
  stats: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    blocked: number;
  };
  selectedStatus?: string;
  productSlug: string;
}

export default function DevTaskStatusFilter({ stats, selectedStatus, productSlug }: Props) {
  const statusCards = [
    { key: 'all', label: 'All Tasks', value: stats.total, color: 'bg-gray-50 hover:bg-gray-100', icon: '📋' },
    { key: 'todo', label: 'To Do', value: stats.todo, color: 'bg-gray-50 hover:bg-gray-100 text-gray-600', icon: '📝' },
    { key: 'in_progress', label: 'In Progress', value: stats.in_progress, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', icon: '⚡' },
    { key: 'done', label: 'Done', value: stats.done, color: 'bg-green-50 hover:bg-green-100 text-green-700', icon: '✅' },
    { key: 'blocked', label: 'Blocked', value: stats.blocked, color: 'bg-red-50 hover:bg-red-100 text-red-700', icon: '🚫' },
  ];

  const getUrl = (statusKey: string) => {
    const baseUrl = `/products/${productSlug}/dev-tasks`;
    return statusKey === 'all' ? baseUrl : `${baseUrl}?status=${statusKey}`;
  };

  const isSelected = (statusKey: string) => {
    if (statusKey === 'all') return !selectedStatus;
    return selectedStatus === statusKey;
  };

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {statusCards.map(s => (
        <Link key={s.key} href={getUrl(s.key)}>
          <div className={clsx(
            'card p-4 cursor-pointer transition-all',
            s.color,
            isSelected(s.key) && 'ring-2 ring-offset-2 ring-blue-500 shadow-lg'
          )}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs mt-0.5 font-medium">{s.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
