import type { ReactNode } from 'react';
import { AlertCircle, KeyRound, SearchX, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center"
      role="status"
    >
      <div className="mb-4 rounded-full bg-white p-3 shadow-sm ring-1 ring-neutral-100" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mb-2 font-headline text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-neutral-500">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="default" className="min-h-[44px]">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={<SearchX className="h-6 w-6 text-neutral-400" />}
      title="No good news found"
      description="We couldn't find any positive stories matching your current filters. Try adjusting your topics or location."
      action={{ label: 'Clear filters', onClick: onClear }}
    />
  );
}

export function NoApiKeyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <EmptyState
      icon={<KeyRound className="h-6 w-6 text-amber-500" />}
      title="OpenAI API Key Required"
      description="GoodNews uses AI to filter out negativity and summarize long articles into quick, uplifting takeaways. Your key is stored locally."
      action={{ label: 'Add API Key', onClick: onOpenSettings }}
    />
  );
}

export function DailyCapReachedState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-6 w-6 text-brand" />}
      title="Daily Cap Reached"
      description="You've reached your daily limit for AI summaries. This helps control your OpenAI API costs. You can increase this limit in settings."
      action={{ label: 'Manage Limits', onClick: onOpenSettings }}
    />
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-6 w-6 text-red-500" />}
      title="Something went wrong"
      description={error}
      action={{ label: 'Try again', onClick: onRetry }}
    />
  );
}
