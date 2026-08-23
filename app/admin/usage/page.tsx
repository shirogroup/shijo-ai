'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Zap, TrendingDown } from 'lucide-react';

interface Row { [k: string]: string | number | null }
interface Data {
  windowDays: number;
  costTrackingStarted: string;
  rowsWithoutCostData: number;
  totals: { generations: number; costUsd: number };
  byDay: Row[]; byTool: Row[]; byPlan: Row[]; byUser: Row[];
}

const money = (n: unknown) => `$${Number(n ?? 0).toFixed(4)}`;
const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Standard', growth: 'Pro', enterprise: 'Enterprise' };

export default function AdminUsagePage() {
  const [data, setData] = useState<Data | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/usage?days=${days}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => (j.success ? setData(j) : setError(j.error || 'Could not load usage')))
      .catch(() => setError('Network error'));
  }, [days]);

  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!data) return <div className="p-8 text-gray-400">Loading…</div>;

  const avg = data.totals.generations ? data.totals.costUsd / data.totals.generations : 0;

  return (
    <div className="p-8 space-y-8 text-gray-200">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">API spend</h1>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
          {[7, 30, 90, 365].map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      {/* An unpriced row is not a free row. Say so where the numbers are, not in a doc. */}
      {data.rowsWithoutCostData > 0 && (
        <div className="flex items-start gap-3 bg-amber-900/25 border border-amber-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-200">
            <strong>{data.rowsWithoutCostData} generations in this window have no cost data.</strong>{' '}
            Cost tracking began {data.costTrackingStarted}; before that only output tokens were stored,
            so those calls cannot be priced retrospectively. Totals below are an <em>under</em>-estimate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: 'Total API cost', value: money(data.totals.costUsd) },
          { icon: Zap, label: 'Generations', value: data.totals.generations.toLocaleString() },
          { icon: TrendingDown, label: 'Avg cost / generation', value: money(avg) },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <s.icon className="w-3.5 h-3.5" />{s.label}
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <Table title="Cost by tool" head={['Tool', 'Generations', 'Input tok', 'Output tok', 'Cost']}
        rows={data.byTool.map(t => [String(t.tool), t.generations, t.inputTokens, t.outputTokens, money(t.costUsd)])} />

      <Table title="Cost by plan" head={['Plan', 'Generations', 'Cost']}
        rows={data.byPlan.map(p => [PLAN_LABEL[String(p.plan)] ?? String(p.plan), p.generations, money(p.costUsd)])} />

      <Table title="Margin per customer" head={['Email', 'Plan', 'Generations', 'API cost', 'Revenue/mo', 'Margin']}
        rows={data.byUser.map(u => [
          String(u.email), PLAN_LABEL[String(u.plan)] ?? String(u.plan), u.generations,
          money(u.costUsd), `$${u.monthlyRevenueUsd}`,
          <span key="m" className={Number(u.marginUsd) < 0 ? 'text-red-400 font-semibold' : 'text-green-400'}>
            ${Number(u.marginUsd).toFixed(2)}
          </span>,
        ])} />

      <Table title="Daily" head={['Day', 'Generations', 'Cost']}
        rows={data.byDay.map(d => [String(d.day), d.generations, money(d.costUsd)])} />
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              {head.map(h => <th key={h} className="text-left font-medium px-4 py-2.5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={head.length} className="px-4 py-6 text-gray-500">No data in this window.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800/60 last:border-0">
                {r.map((c, j) => <td key={j} className="px-4 py-2.5 text-gray-300">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
