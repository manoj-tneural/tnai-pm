export type Role = 'management' | 'engineer' | 'project_manager' | 'sales' | 'testing';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  status: 'active' | 'beta' | 'planning' | 'archived';
  tech_stack: string[];
  color: string;
  icon: string;
  created_at: string;
}

export interface Feature {
  id: string;
  product_id: string;
  feature_id: string | null;
  name: string;
  category: string | null;
  status: 'completed' | 'in_progress' | 'planned' | 'blocked';
  dev_hours: string | null;
  llm_based: boolean;
  pre_trained: string | null;
  deployment_type: string | null;
  num_usecases: number | null;
  num_cameras: number | null;
  cost: string | null;
  requirements: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface Deployment {
  id: string;
  product_id: string;
  customer_name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  day0_date: string | null;
  notes: string | null;
  num_stores: number;
  num_cameras: number;
  created_at: string;
}

export interface DeploymentTask {
  id: string;
  deployment_id: string;
  day_label: string | null;
  phase: string | null;
  task_no: string | null;
  task_desc: string;
  owner: string | null;
  status: 'done' | 'ongoing' | 'todo' | 'blocked';
  remarks: string | null;
  completion_date: string | null;
  sort_order: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  product_id: string;
  log_date: string;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  created_at: string;
  profiles?: Profile;
  products?: Product;
}

export interface Ticket {
  id: string;
  product_id: string;
  deployment_id: string | null;
  title: string;
  description: string | null;
  type: 'bug' | 'feature' | 'improvement' | 'task' | 'question';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'in_review' | 'resolved' | 'closed';
  reporter_id: string | null;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  products?: Product;
  reporter?: Profile;
  assignee?: Profile;
  deployments?: Deployment;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: Profile;
}

export interface DevTask {
  id: string;
  product_id: string;
  phase: string | null;
  task_id: string | null;
  sub_task: string;
  description: string | null;
  dev_hours: number | null;
  planned_start: string | null;
  planned_end: string | null;
  status: 'done' | 'in_progress' | 'todo' | 'blocked';
  assignee_id: string | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  management: 'Management',
  engineer: 'Engineer',
  project_manager: 'Project Manager',
  sales: 'Sales',
  testing: 'Testing',
};

export const ROLE_COLORS: Record<Role, string> = {
  management: 'bg-purple-100 text-purple-800',
  engineer: 'bg-blue-100 text-blue-800',
  project_manager: 'bg-green-100 text-green-800',
  sales: 'bg-orange-100 text-orange-800',
  testing: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS = {
  feature: {
    completed:   'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    planned:     'bg-gray-100 text-gray-700',
    blocked:     'bg-red-100 text-red-800',
  },
  deployment: {
    planning:    'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-800',
    completed:   'bg-green-100 text-green-800',
    on_hold:     'bg-yellow-100 text-yellow-800',
    cancelled:   'bg-red-100 text-red-800',
  },
  task: {
    done:        'bg-green-100 text-green-800',
    ongoing:     'bg-blue-100 text-blue-800',
    todo:        'bg-gray-100 text-gray-700',
    blocked:     'bg-red-100 text-red-800',
  },
  ticket: {
    open:        'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    in_review:   'bg-purple-100 text-purple-800',
    resolved:    'bg-green-100 text-green-800',
    closed:      'bg-gray-100 text-gray-700',
  },
  priority: {
    critical: 'bg-red-100 text-red-800',
    high:     'bg-orange-100 text-orange-800',
    medium:   'bg-yellow-100 text-yellow-800',
    low:      'bg-gray-100 text-gray-700',
  },
};
