import React from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

// 简单SVG饼图实现，兼容所有React项目
export const SimplePieChart: React.FC<PieChartProps> = ({ data, size = 180 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let acc = 0;
  const center = size / 2;
  const radius = center - 8;
  if (data.length === 1) {
    // 只有一个分类时，画满圆
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill={data[0].color} stroke="#fff" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const startAngle = (acc / total) * 2 * Math.PI;
        acc += d.value;
        const endAngle = (acc / total) * 2 * Math.PI;
        const x1 = center + radius * Math.sin(startAngle);
        const y1 = center - radius * Math.cos(startAngle);
        const x2 = center + radius * Math.sin(endAngle);
        const y2 = center - radius * Math.cos(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        const pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
          'Z',
        ].join(' ');
        return (
          <path key={i} d={pathData} fill={d.color} stroke="#fff" strokeWidth="1.5" />
        );
      })}
      {/* 圆环白边 */}
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  );
};
