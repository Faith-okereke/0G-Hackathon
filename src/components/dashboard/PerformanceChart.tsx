import React from 'react';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { PerformancePoint } from '../../types';

interface PerformanceChartProps {
  chartData: PerformancePoint[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ chartData = [] }) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-lg">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue" />
          7-Day Vault Balance AreaChart
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Vertical dashed markers indicate real-time autonomous AI rebalancing executions.</p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={10} 
              tickLine={false} 
              domain={['dataMin - 500', 'dataMax + 500']}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
              labelStyle={{ color: '#F1F5F9', fontWeight: 'bold', fontSize: '11px' }}
              itemStyle={{ color: '#60A5FA', fontSize: '11px' }}
              formatter={(val: any) => [`$${val.toLocaleString()}`, 'Total Value']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#2563EB" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
            {/* Mark simulated on-chain automated action lines */}
            {chartData.map((pt, index) => {
              if (pt.actionMarker) {
                return (
                  <ReferenceLine
                    key={index}
                    x={pt.date}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    opacity={0.6}
                    label={{ value: '⚡ AI Rebalance', position: 'top', fill: '#16A34A', fontSize: 9 }}
                  />
                );
              }
              return null;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
