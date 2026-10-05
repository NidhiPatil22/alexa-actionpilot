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
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse">
        <div className="h-6 w-36 bg-slate-800 rounded mb-4"></div>
        <div className="h-32 bg-slate-800/60 rounded"></div>
      </div>
    );
  }

  const chartData = [
    { name: 'Meetings', minutes: report.totalScheduledMinutes, fill: '#6366F1' },
    { name: 'Free Slots', minutes: report.totalFreeMinutes, fill: '#06B6D4' },
    { name: 'Task Demand', minutes: report.taskDemandMinutes, fill: '#F59E0B' }
  ];

  const getStressBadge = (stress: string) => {
    switch (stress) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Overloaded
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> High Load
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Balanced
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Healthy Flow
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 lg:p-6 border border-slate-800 shadow-glass">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Workload & Burnout Radar
          </h2>
        </div>
        <div>{getStressBadge(report.stressLevel)}</div>
      </div>

      {/* Chart visualization */}
      <div className="h-40 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="m" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B0F19',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f8fafc'
              }}
              formatter={(value) => [`${value} minutes`, 'Duration']}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Deadline distribution metrics */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center mb-3">
        <div className="p-2 rounded-lg bg-obsidian-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Today</div>
          <div className="text-sm font-bold text-rose-400 font-mono">
            {report.deadlineDistribution.today}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-obsidian-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">Tomorrow</div>
          <div className="text-sm font-bold text-amber-400 font-mono">
            {report.deadlineDistribution.tomorrow}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-obsidian-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">In 3 Days</div>
          <div className="text-sm font-bold text-indigo-400 font-mono">
            {report.deadlineDistribution.within3Days}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-obsidian-950 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-mono">In Week</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            {report.deadlineDistribution.withinWeek}
          </div>
        </div>
      </div>

      {/* Intelligent recommendation quote */}
      {report.recommendations.length > 0 && (
        <div className="p-2.5 rounded-lg bg-obsidian-900 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-alexa-cyan shrink-0 mt-0.5" />
          <span>{report.recommendations[0]}</span>
        </div>
      )}
    </div>
  );
};
