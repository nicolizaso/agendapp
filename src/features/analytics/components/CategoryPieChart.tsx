import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ChartData } from '../utils/types';

interface Props {
  data: ChartData[];
}

export function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 border border-neutral-800 rounded-xl bg-neutral-900/50">
        Sin datos suficientes
      </div>
    );
  }

  return (
    <div className="h-72 w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
      <h3 className="text-lg font-heading font-semibold text-neutral-200 mb-4">Tareas por Categoría</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0)" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#e5e5e5' }}
            itemStyle={{ color: '#e5e5e5' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-neutral-400 text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
