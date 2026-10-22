import React from 'react';
import { Activity, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { WorkloadReport } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WorkloadRadarProps {
  report: WorkloadReport | null;
}

export const WorkloadRadar: React.FC<WorkloadRadarProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-purple-500/20 animate-pulse h-full">
        <div className="h-6 w-36 bg-purple-900/40 rounded-full mb-4"></div>
        <div className="h-32 bg-purple-950/40 rounded-2xl"></div>
      </div>
    );
  }

  const chartData = [
    { name: 'Meetings', minutes: report.totalScheduledMinutes, fill: '#8B5CF6' },
    { name: 'Free Slots', minutes: report.totalFreeMinutes, fill: '#D946EF' },
    { name: 'Task Demand', minutes: report.taskDemandMinutes, fill: '#A855F7' }
  ];

  const getStressBadge = (stress: string) => {
    switch (stress) {
      case 'critical':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Overloaded
          </span>
        );
      case 'high':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> High Load
          </span>
        );
      case 'moderate':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Balanced
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Healthy Flow
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-purple-500/20 shadow-glass backdrop-blur-2xl bg-obsidian-900/80 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-fuchsia-400" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Workload
            </h2>
          </div>
          <div>{getStressBadge(report.stressLevel)}</div>
        </div>

        {/* Chart visualization */}
        <div className="h-44 w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#a855f7" fontSize={11} tickLine={false} />
              <YAxis stroke="#a855f7" fontSize={11} tickLine={false} unit="m" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0614',
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  color: '#f8fafc',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
                formatter={(value) => [`${value} minutes`, 'Duration']}
              />
              <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        {/* Deadline distribution metrics */}
        <div className="grid grid-cols-4 gap-2.5 pt-3 border-t border-purple-500/20 text-center mb-3">
          <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-purple-500/20">
            <div className="text-[10px] text-purple-300/70 font-mono">Today</div>
            <div className="text-sm font-bold text-rose-400 font-mono">
              {report.deadlineDistribution.today}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-purple-500/20">
            <div className="text-[10px] text-purple-300/70 font-mono">Tomorrow</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {report.deadlineDistribution.tomorrow}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-purple-500/20">
            <div className="text-[10px] text-purple-300/70 font-mono">In 3 Days</div>
            <div className="text-sm font-bold text-purple-300 font-mono">
              {report.deadlineDistribution.within3Days}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-obsidian-950/80 border border-purple-500/20">
            <div className="text-[10px] text-purple-300/70 font-mono">In Week</div>
            <div className="text-sm font-bold text-fuchsia-400 font-mono">
              {report.deadlineDistribution.withinWeek}
            </div>
          </div>
        </div>

        {/* Intelligent recommendation quote */}
        {report.recommendations.length > 0 && (
          <div className="p-3 rounded-2xl bg-purple-950/25 border border-purple-500/20 text-[11px] text-purple-100/90 flex items-start gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
            <span>{report.recommendations[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};

