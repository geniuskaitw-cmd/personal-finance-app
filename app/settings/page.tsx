'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameList, setNameList] = useState<{ user_id: string; display_name: string }[]>([]);
  const [budget, setBudget] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    setLoading(true);
    const { data: nameData } = await supabase.from('p_user_names').select('*').order('id', { ascending: true });
    if (nameData) setNameList(nameData);
    const { data: budgetData } = await supabase.from('p_budgets').select('*').limit(1).single();
    if (budgetData && typeof budgetData.budget === 'number') setBudget(budgetData.budget);
    else setBudget('');
    setLoading(false);
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim() || !displayName.trim()) { alert('請輸入 userId 與顯示名稱'); return; }
    const { error } = await supabase.from('p_user_names').upsert({ user_id: userId.trim(), display_name: displayName.trim(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { console.error(error); alert('儲存失敗，請稍後再試'); return; }
    alert('已儲存暱稱'); loadSettings();
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    if (budget === '' || isNaN(Number(budget))) { alert('請輸入正確的預算金額'); return; }
    const { data } = await supabase.from('p_budgets').select('*').limit(1).single();
    if (!data) {
      const { error } = await supabase.from('p_budgets').insert({ budget: Number(budget), updated_at: new Date().toISOString() });
      if (error) { console.error(error); alert('新增預算失敗'); return; }
    } else {
      const { error } = await supabase.from('p_budgets').update({ budget: Number(budget), updated_at: new Date().toISOString() }).eq('id', data.id);
      if (error) { console.error(error); alert('更新預算失敗'); return; }
    }
    alert('已儲存預算'); loadSettings();
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight text-foreground mb-4">設定</h1>
      {loading && <p className="text-muted-foreground text-sm">載入中...</p>}
      {!loading && (
        <div className="space-y-6">
          <section className="brutalist-card p-5">
            <h2 className="text-foreground text-sm font-semibold mb-2">userId 顯示名稱</h2>
            <p className="text-muted-foreground text-xs mb-3">這裡可以設定「哪一個 userId 要顯示為什麼名稱」。</p>
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-muted-foreground text-xs mb-1">userId</label>
                <input value={userId} onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-card border-2 border-primary/50 rounded-md px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all"
                  placeholder="請輸入 userId" />
              </div>
              <div>
                <label className="block text-muted-foreground text-xs mb-1">顯示名稱</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-card border-2 border-primary/50 rounded-md px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all"
                  placeholder="例如：爸爸、老婆、小孩" />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground text-sm py-3 rounded-md font-bold active:scale-[0.98] transition-transform">儲存</button>
            </form>
            <div className="mt-4">
              <h3 className="text-foreground text-sm font-semibold mb-2">目前設定列表</h3>
              {nameList.length === 0 && <p className="text-muted-foreground text-xs">尚未設定任何 userId。</p>}
              <ul className="space-y-2">
                {nameList.map((item) => (
                  <li key={item.user_id} className="bg-secondary rounded-md p-4 flex justify-between border-2 border-primary/20">
                    <span className="text-muted-foreground break-all text-xs">{item.user_id}</span>
                    <span className="text-foreground font-semibold text-xs">{item.display_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="brutalist-card p-5">
            <h2 className="text-foreground text-sm font-semibold mb-2">每月預算（全站共用）</h2>
            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-muted-foreground text-xs mb-1">預算金額</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-card border-2 border-primary/50 rounded-md px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all"
                  placeholder="請輸入本月預算" />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground text-sm py-3 rounded-md font-bold active:scale-[0.98] transition-transform">儲存預算</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}