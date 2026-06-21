'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface TaskItem {
  id: string;
  title: string;
  type: 'dev-task' | 'deployment' | 'ticket';
  status: string;
  planned_end_date?: string;
  due_date?: string;
  priority?: string;
  product_name?: string;
  task_id?: string;
  deployment_id?: string;
  ticket_id?: string;
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  testing: 'bg-purple-100 text-purple-700',
  open: 'bg-orange-100 text-orange-700',
  closed: 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

function formatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function getDaysUntil(date: string | undefined): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diff = targetDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDateCategory(date: string | undefined): 'today' | '7days' | '30days' | 'overdue' | null {
  const days = getDaysUntil(date);
  if (days === null) return null;
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return '7days';
  if (days <= 30) return '30days';
  return null;
}

interface EngineerDashboardProps {
  userId: string;
  userName: string;
}

export default function EngineerDashboard({ userId, userName }: EngineerDashboardProps) {
  const [tasks, setTasks] = useState<{ today: TaskItem[]; sevenDays: TaskItem[]; thirtyDays: TaskItem[]; tickets: TaskItem[] }>({
    today: [],
    sevenDays: [],
    thirtyDays: [],
    tickets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  async function fetchTasks() {
    try {
      setLoading(true);
      const [devTasksRes, deploymentsRes, ticketsRes] = await Promise.all([
        fetch(`/api/engineer-dashboard/dev-tasks?user_id=${userId}`),
        fetch(`/api/engineer-dashboard/deployments?user_id=${userId}`),
        fetch(`/api/engineer-dashboard/tickets?user_id=${userId}`),
      ]);

      const devTasks = devTasksRes.ok ? await devTasksRes.json() : { items: [] };
      const deployments = deploymentsRes.ok ? await deploymentsRes.json() : { items: [] };
      const tickets = ticketsRes.ok ? await ticketsRes.json() : { items: [] };

      const allItems = [...(devTasks.items || []), ...(deployments.items || [])];
      
      setTasks({
        today: allItems.filter(t => getDateCategory(t.planned_end_date || t.due_date) === 'today'),
        sevenDays: allItems.filter(t => getDateCategory(t.planned_end_date || t.due_date) === '7days'),
        thirtyDays: allItems.filter(t => getDateCategory(t.planned_end_date || t.due_date) === '30days'),
        tickets: tickets.items || [],
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalTasks = tasks.today.length + tasks.sevenDays.length + tasks.thirtyDays.length;
  const openTickets = tasks.tickets.filter(t => t.status === 'open').length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">👋 Welcome, {userName}!</h1>
        <p className="text-gray-500 mt-1">Here's your task summary for the week</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Today', value: tasks.today.length, icon: '📅', color: 'bg-blue-50 text-blue-700' },
          { label: 'Next 7 Days', value: tasks.sevenDays.length, icon: '📊', color: 'bg-green-50 text-green-700' },
          { label: 'Next 30 Days', value: tasks.thirtyDays.length, icon: '📈', color: 'bg-purple-50 text-purple-700' },
          { label: 'Open Tickets', value: openTickets, icon: '🎫', color: 'bg-orange-50 text-orange-700' },
        ].map(stat => (
          <div key={stat.label} className={clsx('card p-5', stat.color)}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading your tasks...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today's Tasks */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Today's Tasks ({tasks.today.length})</h2>
            {tasks.today.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <div>No tasks due today</div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Task</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Type</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Product</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.today.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                        <td className="px-4 py-3 text-xs"><span className="badge bg-blue-100 text-blue-700">{task.type === 'dev-task' ? 'Dev Task' : task.type === 'deployment' ? 'Deployment' : 'Ticket'}</span></td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{task.product_name || '—'}</td>
                        <td className="px-4 py-3"><span className={clsx('badge text-xs', STATUS_COLORS[task.status] || 'bg-gray-100')}>{task.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Next 7 Days */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Due in Next 7 Days ({tasks.sevenDays.length})</h2>
            {tasks.sevenDays.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">✨</div>
                <div>No tasks due in the next 7 days</div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Task</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Due Date</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.sevenDays.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(task.planned_end_date || task.due_date)}</td>
                        <td className="px-4 py-3"><span className={clsx('badge text-xs', STATUS_COLORS[task.status] || 'bg-gray-100')}>{task.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Next 30 Days */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Due in Next 30 Days ({tasks.thirtyDays.length})</h2>
            {tasks.thirtyDays.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🎯</div>
                <div>No tasks due in the next 30 days</div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Task</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Due Date</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Days Left</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.thirtyDays.map(task => {
                      const daysLeft = getDaysUntil(task.planned_end_date || task.due_date);
                      return (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(task.planned_end_date || task.due_date)}</td>
                          <td className="px-4 py-3 text-xs font-semibold">{daysLeft} days</td>
                          <td className="px-4 py-3"><span className={clsx('badge text-xs', STATUS_COLORS[task.status] || 'bg-gray-100')}>{task.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Open Tickets */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎫 Open Tickets ({openTickets})</h2>
            {tasks.tickets.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🎉</div>
                <div>No open tickets</div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Ticket</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Product</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Priority</th>
                      <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.tickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{ticket.title}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{ticket.product_name || '—'}</td>
                        <td className="px-4 py-3"><span className={clsx('badge text-xs', PRIORITY_COLORS[ticket.priority || 'medium'])}>{ticket.priority || 'medium'}</span></td>
                        <td className="px-4 py-3"><span className={clsx('badge text-xs', STATUS_COLORS[ticket.status] || 'bg-gray-100')}>{ticket.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
