import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, Clock, Users, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface AttentionItem {
  id: string;
  type: 'registration' | 'document' | 'tour' | 'attendance' | 'capacity';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  link: string;
  timestamp?: string;
  count?: number;
}

interface AttentionRequiredProps {
  items: AttentionItem[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function AttentionRequired({
  items,
  isLoading = false,
  isEmpty = false,
}: AttentionRequiredProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <Users size={16} />;
      case 'document':
        return <AlertCircle size={16} />;
      case 'tour':
        return <Calendar size={16} />;
      case 'attendance':
        return <Clock size={16} />;
      case 'capacity':
        return <AlertCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={20} className="text-accent-600" />
          Attention Required
        </CardTitle>
        <CardDescription>
          {items.length === 0
            ? 'All systems nominal'
            : `${items.length} item${items.length !== 1 ? 's' : ''} need attention`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isEmpty || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle size={32} className="text-success-600 mb-2" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No items requiring attention
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className="block p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-1">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        {item.count && (
                          <Badge variant="outline" className="text-xs">
                            {item.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant={getUrgencyColor(item.urgency) as any}>
                      {item.urgency}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
