import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  previousPeriod?: string;
  icon: React.ReactNode;
  bgColor?: string;
  status?: 'normal' | 'warning' | 'critical' | 'success';
  isLoading?: boolean;
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  unit = '',
  change,
  previousPeriod,
  icon,
  bgColor = 'bg-primary-50 dark:bg-primary-900/20',
  status = 'normal',
  isLoading,
  subtitle,
}: KPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-success-600 dark:text-success-400';
      case 'warning':
        return 'text-accent-600 dark:text-accent-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary-600 dark:text-primary-400';
    }
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'success':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'critical':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </CardTitle>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bgColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {value}
              </span>
              {unit && <span className="text-sm text-neutral-500">{unit}</span>}
            </div>

            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {subtitle}
              </p>
            )}

            {change !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                {change > 0 ? (
                  <TrendingUp size={16} className="text-success-600" />
                ) : change < 0 ? (
                  <TrendingDown size={16} className="text-red-600" />
                ) : (
                  <Minus size={16} className="text-neutral-500" />
                )}
                <Badge variant={getBadgeVariant()}>
                  <span className={cn(
                    'text-xs font-medium',
                    change > 0 ? 'text-success-600' : change < 0 ? 'text-red-600' : 'text-neutral-600'
                  )}>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </Badge>
                {previousPeriod && (
                  <span className="text-xs text-neutral-500">vs {previousPeriod}</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
