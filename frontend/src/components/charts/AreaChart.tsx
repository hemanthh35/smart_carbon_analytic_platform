import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '../../utils/helpers';

export interface AreaConfig {
  key: string;
  color: string;
  name?: string;
}

export interface AreaChartProps {
  data: any[];
  xKey: string;
  areas: AreaConfig[];
  height?: number;
  yTickFormatter?: (val: any) => string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  areas,
  height = 300,
  yTickFormatter,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {areas.map((area) => (
              <linearGradient key={`grad-${area.key}`} id={`grad-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-dark-800" />
          <XAxis
            dataKey={xKey}
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
            tickFormatter={yTickFormatter || ((v) => formatNumber(v))}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-dark-600 dark:text-dark-400 font-semibold">{value}</span>}
          />
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name || area.key}
              stroke={area.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${area.key})`}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default AreaChart;
