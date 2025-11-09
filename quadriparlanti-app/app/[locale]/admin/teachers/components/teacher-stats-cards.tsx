'use client';

/**
 * Teacher Stats Cards Component
 * Displays statistics about teachers (total, active, inactive, suspended)
 */

import { Card } from '@/components/ui/card';
import { Users, UserCheck, UserX, Ban } from 'lucide-react';
import type { TeacherStats } from '@/lib/types/teacher.types';

interface TeacherStatsCardsProps {
  stats: TeacherStats;
}

export function TeacherStatsCards({ stats }: TeacherStatsCardsProps) {
  const statCards = [
    {
      title: 'Totale Docenti',
      value: stats.total,
      icon: Users,
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Attivi',
      value: stats.active,
      icon: UserCheck,
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/20',
    },
    {
      title: 'Inattivi',
      value: stats.inactive,
      icon: UserX,
      bgColor: 'bg-gray-500/10',
      iconColor: 'text-gray-400',
      borderColor: 'border-gray-500/20',
    },
    {
      title: 'Sospesi',
      value: stats.suspended,
      icon: Ban,
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={`border ${stat.borderColor} ${stat.bgColor} p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
