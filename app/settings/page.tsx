'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameList, setNameList] = useState<{ user_id: string; display_name: string }[]>([]);

  const [budget, setBudget] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // è¼‰å…¥?±ç¨±?—è¡¨ + ?ç?
  // -----------------------------
  async function loadSettings() {
    setLoading(true);

    // è®€?–å…¨?¨æš±ç¨?user_names)
    const { data: nameData } = await supabase
      .from('p_user_names')
      .select('*')
      .order('id', { ascending: true });

    if (nameData) {
      setNameList(nameData);
    }

    // è®€?–é?ç®?budgetsï¼ˆæ°¸? åª?‰ä?ç­†ï?
    const { data: budgetData } = await supabase
      .from('p_budgets')
      .select('*')
      .limit(1)
      .single();

    if (budgetData && typeof budgetData.budget === 'number') {
      setBudget(budgetData.budget);
    } else {
      setBudget('');
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // -----------------------------
  // ?²å??±ç¨±
  // -----------------------------
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();

    if (!userId.trim() || !displayName.trim()) {
      alert('è«‹è¼¸??userId ?‡é¡¯ç¤ºå?ç¨?);
      return;
    }

    // upsertï¼šå???user_id å­˜åœ¨ ??updateï¼›å¦??insert
    const { error } = await supabase.from('p_user_names').upsert(
      {
        user_id: userId.trim(),
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error(error);
      alert('?²å?å¤±æ?ï¼Œè?ç¨å??è©¦');
      return;
    }

    alert('å·²å„²å­˜æš±ç¨?);
    loadSettings();
  }

  // -----------------------------
  // ?²å??ç?ï¼ˆbudgets æ°¸é??ªæ??‰ä?ç­?id=1ï¼?
  // -----------------------------
  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();

    if (budget === '' || isNaN(Number(budget))) {
      alert('è«‹è¼¸?¥æ­£ç¢ºç??ç??‘é?');
      return;
    }

    // ?¥æ˜¯?¦å·²?‰è???
    const { data } = await supabase.from('p_budgets').select('*').limit(1).single();

    if (!data) {
      // æ²’è?????insert
      const { error } = await supabase.from('p_budgets').insert({
        budget: Number(budget),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(error);
        alert('?²å??ç?å¤±æ?');
        return;
      }
    } else {
      // ?‰è?????update
      const { error } = await supabase
        .from('p_budgets')
        .update({
          budget: Number(budget),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (error) {
        console.error(error);
        alert('?´æ–°?ç?å¤±æ?');
        return;
      }
    }

    alert('å·²å„²å­˜é?ç®?);
    loadSettings();
  }

  // -----------------------------
  // ?«é¢
  // -----------------------------
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="font-[family-name:var(--font-headline)] text-xl font-semibold tracking-tight text-md-on-surface mb-4">
        è¨­å?
      </h1>

      {loading && <p className="text-md-on-surface-variant text-sm">è¼‰å…¥ä¸­â€?/p>}

      {!loading && (
        <div className="space-y-6">
          {/* ?±ç¨±è¨­å? */}
          <section className="glass-card p-5">
            <h2 className="text-md-on-surface text-sm font-semibold mb-2">userId é¡¯ç¤º?ç¨±</h2>
            <p className="text-md-on-surface-variant text-xs mb-3">
              ?™è£¡?¯ä»¥è¨­å??Œå“ªä¸€??userId è¦é¡¯ç¤ºæ?ä»€éº¼å?ç¨±ã€ã€?
            </p>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-md-on-surface-variant text-xs mb-1">userId</label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-md-surface-container border border-md-outline-variant/10 rounded-xl px-3 py-2.5 text-sm text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                  placeholder="è«‹è¼¸??userId"
                />
              </div>

              <div>
                <label className="block text-md-on-surface-variant text-xs mb-1">é¡¯ç¤º?ç¨±</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-md-surface-container border border-md-outline-variant/10 rounded-xl px-3 py-2.5 text-sm text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                  placeholder="ä¾‹å?ï¼šæ??è€å??å?å­©â€?
                />
              </div>

              <button
                type="submit"
                className="w-full primary-gradient text-md-on-primary text-sm py-3 rounded-full font-bold kinetic-glow active:scale-[0.98] transition-transform"
              >
                ?²å?
              </button>
            </form>

            {/* ?—è¡¨ */}
            <div className="mt-4">
              <h3 className="text-md-on-surface text-sm font-semibold mb-2">?®å?è¨­å??—è¡¨</h3>
              {nameList.length === 0 && (
                <p className="text-md-on-surface-variant text-xs">å°šæœªè¨­å?ä»»ä? userId??/p>
              )}

              <ul className="space-y-2">
                {nameList.map((item) => (
                  <li
                    key={item.user_id}
                    className="bg-md-surface-container-high rounded-xl p-4 flex justify-between"
                  >
                    <span className="text-md-on-surface-variant break-all text-xs">{item.user_id}</span>
                    <span className="text-md-on-surface font-semibold text-xs">{item.display_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ?ç?è¨­å? */}
          <section className="glass-card p-5">
            <h2 className="text-md-on-surface text-sm font-semibold mb-2">æ¯æ??ç?ï¼ˆå…¨ç«™å…±?¨ï?</h2>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-md-on-surface-variant text-xs mb-1">?ç??‘é?</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-md-surface-container border border-md-outline-variant/10 rounded-xl px-3 py-2.5 text-sm text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                  placeholder="è«‹è¼¸?¥æœ¬?ˆé?ç®?
                />
              </div>

              <button
                type="submit"
                className="w-full primary-gradient text-md-on-primary text-sm py-3 rounded-full font-bold kinetic-glow active:scale-[0.98] transition-transform"
              >
                ?²å??ç?
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
