/**
 * Stat Card Component
 * Reusable card for displaying dashboard statistics
 */

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  badge: { text: string; color: 'emerald' | 'rose' | 'gray' };
}

export function StatCard({ icon, value, label, badge }: StatCardProps) {
  const badgeColors = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    gray: 'text-[#666] border border-white/5',
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/5 rounded-lg p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-md border border-white/5">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeColors[badge.color]}`}>
          {badge.text}
        </span>
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-medium text-white tracking-tight mb-1">{value}</h3>
        <p className="text-xs text-[#666]">{label}</p>
      </div>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:from-white/10 transition-all"></div>
    </div>
  );
}
