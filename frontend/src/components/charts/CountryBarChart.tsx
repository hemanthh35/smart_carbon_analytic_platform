import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CountryAnalytic } from '../../types';
import { formatNumber } from '../../utils/helpers';

export interface CountryBarChartProps {
  data: CountryAnalytic[];
  height?: number;
}

export const CountryBarChart: React.FC<CountryBarChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" className="dark:stroke-dark-800" />
          <XAxis
            type="number"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${formatNumber(v / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="country"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={70}
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
            formatter={(value: any) => [`${formatNumber(value)} t CO₂`, 'Total Emissions']}
          />
          <Bar
            dataKey="total_emissions"
            fill="#5EEAD4" // Accent: pastel teal
            radius={[0, 8, 8, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default CountryBarChart;
