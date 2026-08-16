'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, BookOpen, Calendar, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const kpis = [
    {
      title: 'Total Children',
      value: '148',
      change: '+12%',
      icon: <Users className="text-primary-600 dark:text-primary-400" />,
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      title: 'Active Enrolments',
      value: '142',
      change: '+8%',
      icon: <BookOpen className="text-secondary-600 dark:text-secondary-400" />,
      bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
    },
    {
      title: 'Pending Registrations',
      value: '23',
      change: '+5%',
      icon: <FileText className="text-accent-600 dark:text-accent-400" />,
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
    },
    {
      title: 'Upcoming Tours',
      value: '8',
      change: 'This month',
      icon: <Calendar className="text-success-600 dark:text-success-400" />,
      bgColor: 'bg-success-50 dark:bg-success-900/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {kpi.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                  {kpi.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {kpi.value}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span className="text-success-600 dark:text-success-400 font-medium">
                    {kpi.change}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800 last:pb-0 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      New registration received
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Parent registered child for nursery
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    2 hours ago
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Capacity</span>
                <Badge variant="success">92%</Badge>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full"
                  style={{ width: '92%' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Attendance</span>
                <Badge variant="default">88%</Badge>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: '88%' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Approvals</span>
                <Badge variant="warning">64%</Badge>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full"
                  style={{ width: '64%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
