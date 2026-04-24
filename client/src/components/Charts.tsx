import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ChartProps {
  data: any[];
  type: 'bar' | 'line' | 'pie';
  dataKey: string;
  nameKey: string;
  title: string;
  color?: string;
}

const COLORS = ['#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#a855f7', '#ff6b6b', '#ffc107'];

const Charts: React.FC<ChartProps> = ({ data, type, dataKey, nameKey, title, color = '#4facfe' }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey={nameKey} stroke="#a0aec0" fontSize={12} />
            <YAxis stroke="#a0aec0" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey={nameKey} stroke="#a0aec0" fontSize={12} />
            <YAxis stroke="#a0aec0" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff' }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff' }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
