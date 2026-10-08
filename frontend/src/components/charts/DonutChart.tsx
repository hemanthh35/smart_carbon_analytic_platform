import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '../../utils/helpers';

export interface DonutChartData {
  name: string;
  value: number;
}

export interface DonutChartProps {
  data: DonutChartData[];
  height?: number;
}

const COLORS = ['#8B7BFF', '#38BDF8', '#5EEAD4', '#C4B5FD', '#F59E0B', '#EF4444'];

export const DonutChart: React.FC<DonutChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            itemStyle={{ color: '#0F172A', fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}
            formatter={(value: any) => [`${formatNumber(value)}`, 'Quantity']}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-dark-600 dark:text-dark-455 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default DonutChart;
