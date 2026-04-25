'use client';

import Link from 'next/link';
import clsx from 'clsx';

interface Stats {
  total: number;
  planning: number;
  active: number;
  done: number;
}

interface DeploymentStatusFilterProps {
  stats: Stats;
  currentStatus?: string;
  productSlug: string;
}

export default function DeploymentStatusFilter({ stats, currentStatus, productSlug }: DeploymentStatusFilterProps) {
  const cards = [
    { key: '', label: 'All Deployments', value: stats.total, icon: '📋', color: 'text-gray-700' },
    { key: 'planning', label: 'Planning', value: stats.planning, icon: '📝', color: 'text-gray-700' },
    { key: 'in_progress', label: 'Active', value: stats.active, icon: '⚡', color: 'text-blue-700' },
    { key: 'completed', label: 'Completed', value: stats.done, icon: '✅', color: 'text-green-700' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {cards.map(card => {
        const isSelected = currentStatus === card.key || (!currentStatus && !card.key);
        return (
          <Link
            key={card.key || 'all'}
            href={card.key ? `/products/${productSlug}/deployments?status=${card.key}` : `/products/${productSlug}/deployments`}
            className={clsx(
              'card p-4 cursor-pointer transition-all',
              isSelected && 'ring-2 ring-blue-500 shadow-md',
              !isSelected && 'hover:shadow-sm'
            )}
          >
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className={clsx('text-sm font-medium mt-0.5', card.color)}>{card.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
