
interface StatsCardProps {
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon?: React.ReactNode;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

const valueColorClasses = {
  blue: 'text-blue-900',
  green: 'text-green-900',
  purple: 'text-purple-900',
  orange: 'text-orange-900',
};

export function StatsCard({ title, value, color, icon }: StatsCardProps) {
  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
        {icon && <div className="text-lg">{icon}</div>}
      </div>
      <div className={`text-3xl font-bold ${valueColorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
}