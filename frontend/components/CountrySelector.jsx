"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronDown, Globe } from "lucide-react";

/**
 * Enhanced CountrySelector component
 * Props:
 *  - selected: array of currently selected country names (country_long)
 *  - onChange: function(newSelectedArray)
 *  - max: maximum number of countries that can be selected (default 5)
 */
export default function CountrySelector({ selected = [], onChange, max = 5 }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true);
        const res = await fetch("/api/countries");
        if (!res.ok) {
          throw new Error("Failed to fetch country list");
        }
        const json = await res.json();
        // API may return { success, data } shape or raw array
        const list = (json.data || json).map((c) => c.country_long || c.country);
        // Remove duplicates, sort alphabetically
        const unique = Array.from(new Set(list)).sort();
        setOptions(unique);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCountries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((country) => {
    let next = [...selected];
    if (next.includes(country)) {
      next = next.filter((c) => c !== country);
    } else {
      if (next.length < max) {
        next.push(country);
      }
    }
    onChange(next);
    setSearchTerm("");
    setIsOpen(false);
  }, [selected, max, onChange]);

  const handleRemove = useCallback((countryToRemove) => {
    onChange(selected.filter((c) => c !== countryToRemove));
  }, [selected, onChange]);

  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selected.includes(option)
  );

  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-red-500"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3d4a5d]"></div>
        <span className="ml-2 text-sm text-gray-600">Loading countries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Countries Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map((country, index) => (
          <div
            key={country}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white
              ${colors[index % colors.length]} shadow-md hover:shadow-lg transition-all duration-200
              transform hover:scale-105 cursor-pointer
            `}
            onClick={() => handleRemove(country)}
            title="Click to remove"
          >
            <span>{country}</span>
            <X className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={selected.length >= max}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all duration-200
            ${selected.length >= max 
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-gray-300 hover:border-[#3d4a5d] focus:border-[#3d4a5d] cursor-pointer'
            }
            ${isOpen ? 'border-[#3d4a5d] shadow-lg' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {selected.length >= max 
                ? `Maximum ${max} countries selected` 
                : `Select countries (${selected.length}/${max})`
              }
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3d4a5d] focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No countries found' : 'No more countries available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <span>{option}</span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{filteredOptions.length} countries available</span>
                <span>{selected.length}/{max} selected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

