'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, ChevronRight, PieChart, TrendingUp, X,
  Car, Utensils, ShoppingBag, Gamepad2, Stethoscope, GraduationCap,
  Home, Lamp, Wifi, Plane, Shirt, Gift, Coins,
  Calendar as CalendarIcon,
} from 'lucide-react';

const CATEGORIES = [
  '餐飲食品', '交通', '日用品', '娛樂', '醫療', '教育',
  '住房', '水電瓦斯', '電信網路', '旅遊', '服飾美妝', '送費',
];

const CATEGORY_COLORS: Record<string, string> = {
  '餐飲食品': '#F87171', '交通': '#60A5FA', '日用品': '#34D399',
  '娛樂': '#FBBF24', '醫療': '#A78BFA', '教育': '#F472B6',
  '住房': '#818CF8', '水電瓦斯': '#FCD34D', '電信網路': '#6EE7B7',
  '旅遊': '#38BDF8', '服飾美妝': '#C084FC', '送費': '#9CA3AF',
  '雜費': '#78716C', 'default': '#CBD5E1',
};

function getCategoryColor(cat: string) { return CATEGORY_COLORS[cat] || CATEGORY_COLORS['default']; }

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const props = { className: className || 'w-6 h-6' };
  switch (category) {
    case '餐飲食品': return <Utensils {...props} />;
    case '交通': return <Car {...props} />;
    case '日用品': return <ShoppingBag {...props} />;
    case '娛樂': return <Gamepad2 {...props} />;
    case '醫療': return <Stethoscope {...props} />;
    case '教育': return <GraduationCap {...props} />;
    case '住房': return <Home {...props} />;
    case '水電瓦斯': return <Lamp {...props} />;
    case '電信網路': return <Wifi {...props} />;
    case '旅遊': return <Plane {...props} />;
    case '服飾美妝': return <Shirt {...props} />;
    case '送費': return <Gift {...props} />;
    case '雜費': return <Coins {...props} />;
    default: return <Coins {...props} />;
  }
}

type CategoryStat = { category: string; total: number; percentage: number; color: string; };

function DonutChart({ data, total }: { data: CategoryStat[]; total: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }
  let cumulativePercent = 0;
  const paths = data.map((slice, index) => {
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + (slice.percentage / 100);
    cumulativePercent = endPercent;
    if (slice.percentage >= 99.9) return { ...slice, pathData: `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0`, index };
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slice.percentage / 100 > 0.5 ? 1 : 0;
    const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    return { ...slice, pathData, index };
  });
  const activeItem = activeIndex !== null ? data[activeIndex] : null;
  const centerLabel = activeItem ? activeItem.category : '總支出';
  const centerValue = activeItem ? `${activeItem.percentage.toFixed(1)}%` : `${total.toLocaleString()}`;
  const centerSubValue = activeItem ? `${activeItem.total.toLocaleString()}` : '';
  if (total === 0) {
    return (
      <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[16px] border-accent"></div>
        <div className="text-sm text-muted-foreground">尚無支出</div>
      </div>
    );
  }
  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="transform -rotate-90 w-full h-full">
        {paths.map((slice) => (
          <path key={slice.index} d={slice.pathData} fill="transparent" stroke={slice.color} strokeWidth="0.25"
            className={`cursor-pointer transition-all duration-200 hover:opacity-90 ${activeIndex === slice.index ? 'opacity-100 stroke-[0.28]' : 'opacity-100'}`}
            onClick={() => setActiveIndex(slice.index === activeIndex ? null : slice.index)} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-sm font-medium mb-1 text-muted-foreground">{centerLabel}</div>
        <div className="text-2xl font-bold text-foreground">{centerValue}</div>
        {centerSubValue && <div className="text-sm font-medium mt-1 text-muted-foreground">{centerSubValue}</div>}
      </div>
      {activeIndex !== null && <div className="absolute inset-0 z-[-1] cursor-pointer" onClick={() => setActiveIndex(null)} />}
    </div>
  );
}

function TrendChart({ data, category }: { data: { month: string; total: number }[]; category: string }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const color = getCategoryColor(category);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  if (data.length === 0) return <div className="h-48 flex items-center justify-center text-muted-foreground">無資料</div>;
  return (
    <div className="w-full overflow-x-auto pb-2 touch-pan-x no-scrollbar">
      <div className="flex items-end gap-4 px-2 pt-8 min-w-max">
        {data.map((item, i) => {
          const heightPercent = (item.total / max) * 100;
          const isActive = activeBar === i;
          return (
            <div key={i} className="flex flex-col items-center gap-2 group shrink-0 w-[40px] cursor-pointer" onClick={() => setActiveBar(isActive ? null : i)}>
              <div className="h-32 w-full flex items-end justify-center relative">
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap pointer-events-none transition-opacity text-foreground ${isActive ? 'opacity-100 font-bold' : ''}`}>
                  ${item.total.toLocaleString()}
                </div>
                <div className={`w-full rounded-t-sm transition-all duration-500 relative min-h-[4px] ${isActive ? 'opacity-100 ring-2 ring-offset-1 ring-primary/50' : 'hover:opacity-80'}`}
                  style={{ height: `${heightPercent}%`, backgroundColor: color }} />
              </div>
              <div className={`text-[10px] whitespace-nowrap ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>{item.month.slice(5)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{ month: string; total: number }[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendRange, setTrendRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    if (selectedCategory) {
      const now = new Date();
      const endYear = now.getFullYear();
      const endMonth = now.getMonth() + 1;
      const startObj = new Date(endYear, now.getMonth() - 5, 1);
      const startYear = startObj.getFullYear();
      const startMonth = startObj.getMonth() + 1;
      const fmt = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;
      setTrendRange({ start: fmt(startYear, startMonth), end: fmt(endYear, endMonth) });
    }
  }, [selectedCategory]);

  const currentMonthStr = currentMonth.toISOString().slice(0, 7);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const { data, error } = await supabase.from('p_expenses').select('amount, category').like('time', `${currentMonthStr}%`);
      if (error || !data) { console.error(error); setStats([]); setMonthTotal(0); setLoading(false); return; }
      const map: Record<string, number> = {};
      let total = 0;
      data.forEach((item: any) => {
        const cat = item.category || '未分類';
        const amt = Number(item.amount) || 0;
        if (cat) { map[cat] = (map[cat] || 0) + amt; total += amt; }
      });
      const result: CategoryStat[] = Object.keys(map).map(cat => ({
        category: cat, total: map[cat], percentage: total === 0 ? 0 : (map[cat] / total) * 100, color: getCategoryColor(cat),
      })).sort((a, b) => b.total - a.total);
      setStats(result); setMonthTotal(total); setLoading(false);
    }
    fetchStats();
  }, [currentMonthStr]);

  useEffect(() => {
    if (!selectedCategory || !trendRange.start || !trendRange.end) return;
    async function fetchTrend() {
      setTrendLoading(true);
      const startStr = trendRange.start + '-01';
      const [endY, endM] = trendRange.end.split('-').map(Number);
      let nextY = endY, nextM = endM + 1;
      if (nextM > 12) { nextM = 1; nextY++; }
      const endStr = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
      const { data, error } = await supabase.from('p_expenses').select('amount, time').eq('category', selectedCategory).gte('time', startStr).lt('time', endStr).order('time', { ascending: true });
      if (error || !data) { setTrendData([]); } else {
        const monthMap: Record<string, number> = {};
        let [curY, curM] = trendRange.start.split('-').map(Number);
        while (curY * 12 + curM <= endY * 12 + endM) {
          const k = `${curY}-${String(curM).padStart(2, '0')}`;
          monthMap[k] = 0; curM++;
          if (curM > 12) { curM = 1; curY++; }
        }
        data.forEach((item: any) => { const k = item.time.slice(0, 7); if (monthMap[k] !== undefined) monthMap[k] += Number(item.amount) || 0; });
        const arr = Object.keys(monthMap).sort().map(k => ({ month: k, total: monthMap[k] }));
        setTrendData(arr);
      }
      setTrendLoading(false);
    }
    fetchTrend();
  }, [selectedCategory, trendRange]);

  function prevMonth() { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }
  function nextMonth() { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="brutalist-card p-3 flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-3 hover:bg-accent rounded-md transition-colors">
            <ChevronLeft className="w-6 h-6 stroke-[3] text-primary" />
          </button>
          <div className="text-xl font-bold text-foreground">{currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月</div>
          <button onClick={nextMonth} className="p-3 hover:bg-accent rounded-md transition-colors">
            <ChevronRight className="w-6 h-6 stroke-[3] text-primary" />
          </button>
        </div>

        <div className="brutalist-card p-6 mb-6 flex justify-center">
          <DonutChart data={stats} total={monthTotal} />
        </div>

        <div className="space-y-3 pb-20">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">計算中...</div>
          ) : stats.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">本月尚無資料</div>
          ) : (
            stats.map((stat) => (
              <div key={stat.category} onClick={() => setSelectedCategory(stat.category)}
                className="brutalist-card p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all">
                <div className="w-12 h-12 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                  <CategoryIcon category={stat.category} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <div className="text-foreground font-bold">{stat.category}</div>
                    <div className="text-foreground font-bold">${stat.total.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-sm overflow-hidden bg-muted">
                      <div className="h-full rounded-sm" style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }} />
                    </div>
                    <div className="text-muted-foreground text-xs w-10 text-right">{stat.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))
          )}
        </div>
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCategory(null)}>
          <div className="w-full max-w-4xl brutalist-card rounded-t-md p-6 shadow-xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: getCategoryColor(selectedCategory) + '20', color: getCategoryColor(selectedCategory) }}>
                  <CategoryIcon category={selectedCategory} />
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-bold">{selectedCategory}</h3>
                  <p className="text-muted-foreground text-xs">歷史趨勢</p>
                </div>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="p-2 rounded-md text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex items-center gap-2 mb-4 bg-muted p-2 rounded-md border-2 border-primary/30">
              <div className="flex items-center flex-1">
                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                <input type="month" value={trendRange.start}
                  onChange={e => {
                    const newStart = e.target.value; if (!newStart) return;
                    setTrendRange(p => {
                      const s = new Date(newStart + '-01'); const end = new Date(p.end + '-01');
                      const months = (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth());
                      if (months > 11 || months < 0) { const newEnd = new Date(s); newEnd.setMonth(newEnd.getMonth() + 11); return { start: newStart, end: newEnd.toISOString().slice(0, 7) }; }
                      return { ...p, start: newStart };
                    });
                  }}
                  className="bg-transparent text-foreground text-sm font-medium outline-none w-full" />
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="flex items-center flex-1">
                <input type="month" value={trendRange.end}
                  onChange={e => {
                    const newEnd = e.target.value; if (!newEnd) return;
                    setTrendRange(p => {
                      const s = new Date(p.start + '-01'); const end = new Date(newEnd + '-01');
                      const months = (end.getFullYear() - s.getFullYear()) * 12 + (end.getMonth() - s.getMonth());
                      if (months > 11 || months < 0) { const newStart = new Date(end); newStart.setMonth(newStart.getMonth() - 11); return { start: newStart.toISOString().slice(0, 7), end: newEnd }; }
                      return { ...p, end: newEnd };
                    });
                  }}
                  className="bg-transparent text-foreground text-sm font-medium outline-none w-full text-right" />
              </div>
            </div>

            <div className="bg-muted rounded-md border-2 border-primary/30 p-4 flex-1 min-h-[200px] overflow-hidden flex flex-col">
              {trendLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">載入中...</div>
              ) : (
                <TrendChart data={trendData} category={selectedCategory} />
              )}
            </div>
            <div className="mt-6 text-center text-muted-foreground text-sm">點擊外部關閉</div>
          </div>
        </div>
      )}
    </div>
  );
}