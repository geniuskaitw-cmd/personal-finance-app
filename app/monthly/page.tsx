'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlyPage() {
  const [todayDate, setTodayDate] = useState<Date | null>(null);

  function getTaipeiDateStr(d: Date) {
    return d.toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 10);
  }

  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    const now = new Date();
    setTodayDate(now);
    setCurrent({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const todayStr = todayDate ? getTaipeiDateStr(todayDate) : '';

  const [daySums, setDaySums] = useState<Record<string, number>>({});
  const [monthTotal, setMonthTotal] = useState(0);
  const [budget, setBudget] = useState<number>(0);

  async function loadBudget() {
    const { data, error } = await supabase
      .from('p_budgets')
      .select('budget')
      .order('id', { ascending: false })
      .limit(1);
    if (error) { console.error('loadBudget error', error); return; }
    if (data && data.length > 0) setBudget(data[0].budget);
    else setBudget(0);
  }

  async function loadMonthData(year: number, month: number) {
    const yyyyMm = `${year}-${String(month + 1).padStart(2, '0')}`;
    const { data, error } = await supabase
      .from('p_expenses')
      .select('*')
      .like('time', `${yyyyMm}%`);
    if (error) return console.error(error);

    const sums: Record<string, number> = {};
    let total = 0;
    (data || []).forEach((item) => {
      const d = item.time;
      const amt = item.amount ?? 0;
      if (!sums[d]) sums[d] = 0;
      sums[d] += amt;
      total += amt;
    });
    setDaySums(sums);
    setMonthTotal(total);
  }

  function getCalendarMatrix(y: number, m: number) {
    const firstDay = new Date(y, m, 1);
    const weekday = (firstDay.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const list: (number | null)[] = [];
    for (let i = 0; i < weekday; i++) list.push(null);
    for (let d = 1; d <= days; d++) list.push(d);
    return list;
  }

  function prevMonth() {
    let y = current.year;
    let m = current.month - 1;
    if (m < 0) { m = 11; y -= 1; }
    setCurrent({ year: y, month: m });
    loadMonthData(y, m);
    loadBudget();
  }

  function nextMonth() {
    let y = current.year;
    let m = current.month + 1;
    if (m > 11) { m = 0; y += 1; }
    setCurrent({ year: y, month: m });
    loadMonthData(y, m);
    loadBudget();
  }

  useEffect(() => {
    loadMonthData(current.year, current.month);
    loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function amountColor(n: number) {
    if (n > 0) return 'text-green-500';
    if (n < 0) return 'text-md-error';
    return 'text-md-on-surface-variant';
  }

  const remaining = budget - monthTotal;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="glass-card p-3 flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-3 hover:bg-md-surface-container-highest rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 stroke-[3] text-md-primary" />
        </button>
        <div className="font-[family-name:var(--font-headline)] text-xl font-bold text-md-on-surface">
          {current.year} 年 {current.month + 1} 月
        </div>
        <button onClick={nextMonth} className="p-3 hover:bg-md-surface-container-highest rounded-full transition-colors">
          <ChevronRight className="w-6 h-6 stroke-[3] text-md-primary" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-2 text-md-on-surface-variant uppercase tracking-widest">
        <div>一</div>
        <div>二</div>
        <div>三</div>
        <div>四</div>
        <div>五</div>
        <div>六</div>
        <div>日</div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {getCalendarMatrix(current.year, current.month).map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-12 bg-md-surface-container-low rounded-xl" />;
          }
          const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const sum = daySums[dateStr] ?? 0;
          const isToday = todayDate && dateStr === todayStr && current.year === todayDate.getFullYear() && current.month === todayDate.getMonth();

          return (
            <Link key={idx} href={`/today?date=${dateStr}`}
              className={`h-12 flex flex-col items-center justify-center rounded-xl transition-colors ${isToday ? 'bg-md-primary-container text-md-on-primary font-bold' : 'bg-md-surface-container-high text-md-on-surface'}`}>
              <div className="leading-none">{day}</div>
              {sum !== 0 && (
                <div className={`text-[10px] leading-none mt-0.5 ${isToday ? 'text-md-on-primary' : amountColor(sum)}`}>
                  {sum.toLocaleString()}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="glass-card p-4 flex flex-col items-center">
          <span className="text-xs text-md-on-surface-variant mb-1">本月預算</span>
          <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-md-on-surface">
            {(budget || 0).toLocaleString()}
          </span>
        </div>
        <div className="glass-card p-4 flex flex-col items-center">
          <span className="text-xs text-md-on-surface-variant mb-1">本月消費</span>
          <span className={`font-[family-name:var(--font-headline)] text-lg font-bold ${amountColor(monthTotal)}`}>
            {monthTotal.toLocaleString()}
          </span>
        </div>
        <div className="glass-card p-4 flex flex-col items-center">
          <span className="text-xs text-md-on-surface-variant mb-1">本月餘額</span>
          <span className={`font-[family-name:var(--font-headline)] text-lg font-bold ${remaining < 0 ? 'text-md-error' : 'text-md-on-surface'}`}>
            {remaining.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
