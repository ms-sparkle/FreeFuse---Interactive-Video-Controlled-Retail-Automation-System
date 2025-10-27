"use client";
import React, { useState } from "react";

interface Product {
  productID: number;
  name: string;
  brand: string;
  primary_category: string;
  sale_price?: number;
  list_price?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-lg shadow-lg border border-gray-700 divide-y divide-gray-800">
          {results.map((item) => (
            <div
              key={item.productID}
              className="p-4 hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white">
                {item.name}
              </h3>
              <p className="text-gray-400 text-sm">
                {item.brand} — {item.primary_category}
              </p>
              <p className="text-gray-300 mt-1">
                {item.sale_price
                  ? `$${item.sale_price} (Sale)`
                  : item.list_price
                  ? `$${item.list_price}`
                  : "Price unavailable"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
