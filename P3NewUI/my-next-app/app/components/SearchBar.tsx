"use client";
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function SearchBar({ placeholder = 'Search...' }: { placeholder?: string }) {
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  );
}
