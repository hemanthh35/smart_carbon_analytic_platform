import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EmissionTrendPoint } from '../../types';
import { formatNumber } from '../../utils/helpers';

export interface EmissionTrendChartProps {
  data: EmissionTrendPoint[];
  height?: number;
}

export const EmissionTrendChart: React.FC<EmissionTrendChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B7BFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B7BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-dark-800" />
          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${formatNumber(v / 1000)}k`}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            itemStyle={{ color: '#0F172A', fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}
            formatter={(value: any) => [`${formatNumber(value)} t CO₂`, 'Emissions']}
          />
          <Area
            type="monotone"
            dataKey="emissions"
            stroke="#8B7BFF"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#emissionsGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default EmissionTrendChart;
