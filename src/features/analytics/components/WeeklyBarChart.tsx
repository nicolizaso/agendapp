import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../utils/types';

interface Props {
  data: ChartData[];
}

export function WeeklyBarChart({ data }: Props) {
  return (
    <div className="h-72 w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-heading font-semibold text-neutral-200 mb-4">Rendimiento Semanal</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#525252"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            hide
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#e5e5e5' }}
            itemStyle={{ color: '#ef4444' }} // Red text for value
          />
          <Bar
            dataKey="value"
            fill="#ef4444"
            radius={[4, 4, 4, 4]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
