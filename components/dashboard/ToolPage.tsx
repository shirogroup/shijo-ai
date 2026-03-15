'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { FieldConfig } from '@/lib/tools/registry';
import { CATEGORIES, type ToolCategory } from '@/lib/tools/registry';

interface ToolPageProps {
  toolId: string;
  title: string;
  description: string;
  icon: string;
  category: ToolCategory;
  modelTier: 'haiku' | 'sonnet';
  fields: FieldConfig[];
  outputLabel?: string;
}

export default function ToolPage({
  toolId, title, description, icon, category, modelTier, fields, outputLabel = 'Your Results',
}: ToolPageProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const cat = CATEGORIES[category];

  const handleGenerate = async () => {
    const required = fields.filter((f) => f.required !== false);
    const missing = required.filter((f) => !inputs[f.id]?.trim());
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, inputs }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dashboard/tools" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Tools
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-300">{title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold ${cat.color} ${cat.bgColor} px-3 py-1 rounded-full`}>
            {cat.label}
          </span>
          <span className="text-xs text-gray-500">
            {modelTier === 'haiku' ? 'Fast' : 'Advanced'} AI
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-4xl">{icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="font-semibold text-white mb-5">Your Inputs</h2>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {field.label}
                  {field.required !== false && <span className="text-blue-400 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={inputs[field.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={inputs[field.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={inputs[field.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">{outputLabel}</h2>
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {result ? (
            <div className="flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">{result}</pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-3 opacity-30">{icon}</div>
                <p className="text-sm">Fill in your details and click<br /><strong className="text-gray-400">Generate with AI</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
