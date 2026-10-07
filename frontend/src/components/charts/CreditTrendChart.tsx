import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditTrendPoint } from '../../types';
import { formatNumber } from '../../utils/helpers';

export interface CreditTrendChartProps {
  data: CreditTrendPoint[];
  height?: number;
}

export const CreditTrendChart: React.FC<CreditTrendChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            formatter={(value: any) => [`${formatNumber(value)} credits`, 'Credits']}
          />
          <Line
            type="monotone"
            dataKey="credits"
            stroke="#38BDF8"
            strokeWidth={3}
            dot={{ r: 4, stroke: '#38BDF8', strokeWidth: 2, fill: '#FFF' }}
            activeDot={{ r: 6, stroke: '#38BDF8', strokeWidth: 2, fill: '#FFF' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default CreditTrendChart;
