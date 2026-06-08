import { Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        {icon || <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link to={action.href} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
