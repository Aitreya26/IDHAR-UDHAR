import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Listing, UserProfile, CategoryType } from '../types';
import { ItemVisual } from './ItemVisual';
import { ChevronLeft, Search, Filter, User, MapPin, Clock, X, AlertCircle, Bell } from 'lucide-react';
import { safeStorage } from '../utils/storage';

const RECENT_SEARCHES_KEY = 'idhar_udhar_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface SearchViewProps {
  listings: Listing[];
  currentUser: UserProfile;
  initialQuery?: string;
  initialCategory?: CategoryType | 'All';
  onBack: () => void;
  onSelectListing: (listing: Listing) => void;
  onOpenFullPhoto?: (listing: Listing) => void;
  onOpenCreateRequest?: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  listings,
  currentUser,
  initialQuery = '',
  initialCategory = 'All',
  onBack,
  onSelectListing,
  onOpenFullPhoto,
  onOpenCreateRequest,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>(initialCategory);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return safeStorage.getJSON<string[]>(RECENT_SEARCHES_KEY, []);
  });

  const [soldItemNotice, setSoldItemNotice] = useState<Listing | null>(null);
  const saveTimerRef = useRef<any>(null);

  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      safeStorage.setJSON(RECENT_SEARCHES_KEY, updated);
      return updated;
    });
  };

  const handleRemoveRecentSearch = (termToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== termToRemove.toLowerCase());
      safeStorage.setJSON(RECENT_SEARCHES_KEY, updated);
      return updated;
    });
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    safeStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSelectRecentSearch = (term: string) => {
    setQuery(term);
    saveSearchTerm(term);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchTerm(query);
    }
  };

  const handleListingClick = (item: Listing) => {
    if (item.status === 'completed') {
      setSoldItemNotice(item);
      return;
    }
    if (query.trim()) {
      saveSearchTerm(query);
    }
    onSelectListing(item);
  };

  // Debounced save when user stops typing a search query
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    if (query.trim().length >= 3) {
      saveTimerRef.current = setTimeout(() => {
        saveSearchTerm(query);
      }, 1500);
    }
    return () => clearTimeout(saveTimerRef.current);
  }, [query]);

  const filteredResults = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchesSeller = item.sellerName.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesSeller && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [listings, query, selectedCategory]);

  return (
    <div className="w-full space-y-4 px-5 py-3 select-none pb-12">
      {/* Search Header matching Screenshot 7 */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Search Input Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl focus-within:border-[#4F46E5] dark:focus-within:border-cyan-400 transition-colors"
        >
          <button
            type="submit"
            className="text-slate-400 hover:text-[#4F46E5] dark:hover:text-cyan-400 transition-colors cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4 shrink-0" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => {
              if (query.trim().length >= 2) {
                saveSearchTerm(query);
              }
            }}
            placeholder="Search books, labs..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filter Button matching Screenshot 7 */}
        <button
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
            filterMenuOpen || selectedCategory !== 'All'
              ? 'bg-[#EEF2FF] dark:bg-cyan-950/40 border-[#4F46E5] dark:border-cyan-400 text-[#4F46E5] dark:text-cyan-400'
              : 'bg-[#F8FAFC] dark:bg-slate-800/80 border-[#E2E8F0] dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
          title="Filter category"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Category filter pills if filter opened */}
      {filterMenuOpen && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {['All', 'Books', 'Drafters & Tools', 'Lab Gear', 'Electronics', 'Sports and Fitness', 'Accessories', 'Other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#4F46E5] dark:bg-cyan-500 text-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches Section (Last 5 searches) */}
      {recentSearches.length > 0 && (
        <div className="pt-0.5 pb-1 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-[#4F46E5] dark:text-cyan-400" />
              <span>Recent Searches</span>
              <span className="text-[10px] font-normal text-slate-400">({recentSearches.length})</span>
            </div>
            <button
              type="button"
              onClick={handleClearAllRecentSearches}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {recentSearches.map((term) => (
              <div
                key={term}
                className={`group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs shadow-xs transition-all ${
                  query.toLowerCase() === term.toLowerCase()
                    ? 'bg-[#EEF2FF] dark:bg-cyan-950/40 border-[#4F46E5] dark:border-cyan-400 text-[#4F46E5] dark:text-cyan-300 font-semibold'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#4F46E5]/40 dark:hover:border-cyan-500/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectRecentSearch(term)}
                  className="flex items-center gap-1.5 text-left font-medium cursor-pointer"
                  title={`Search for "${term}"`}
                >
                  <Search className="w-3 h-3 text-slate-400 group-hover:text-[#4F46E5] dark:group-hover:text-cyan-400 transition-colors shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRecentSearch(term);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={`Remove "${term}" from history`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header matching Screenshot 7: "Results (4)" */}
      <div className="pt-1 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Results ({filteredResults.length})
        </h3>
        {query && (
          <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
            for &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {/* Vertical List of Cards matching Screenshot 7 */}
      <div className="space-y-3 pb-8">
        {filteredResults.map((item) => {
          const isSold = item.status === 'completed';

          return (
            <div
              key={item.id}
              onClick={() => handleListingClick(item)}
              className={`rounded-2xl border p-3 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${
                isSold
                  ? 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800 hover:shadow-md'
              }`}
            >
              {/* Left: Pastel Container with Icon or Photo */}
              <div className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 group/img ${isSold ? 'grayscale contrast-75 brightness-90' : ''}`}>
                <ItemVisual
                  title={item.title}
                  category={item.category}
                  tags={item.tags}
                  imageUrl={item.imageUrl}
                  className="w-full h-full"
                />

                {/* Tint overlay for sold items */}
                {isSold && (
                  <div className="absolute inset-0 bg-slate-900/25 pointer-events-none z-10" />
                )}

                {/* Slanted SOLD Ribbon on Image */}
                {isSold && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none z-20">
                    <div className="absolute transform rotate-45 bg-red-600 text-white font-black text-[9px] py-0.5 right-[-24px] top-[12px] w-[80px] text-center shadow-lg uppercase tracking-widest border-y border-white/30 select-none">
                      SOLD
                    </div>
                  </div>
                )}

                {!isSold && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFullPhoto?.(item);
                    }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="View full photo"
                  >
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70">Full</span>
                  </button>
                )}
              </div>

              {/* Center: Title, Tags, Seller & Hostel */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-sm font-bold truncate flex-1 ${
                    isSold
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-cyan-400 transition-colors'
                  }`}>
                    {item.title}
                  </h4>
                  {isSold && (
                    <span className="shrink-0 px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black text-[9px] uppercase tracking-wide">
                      SOLD
                    </span>
                  )}
                </div>

                {/* Tags row: e.g. "Stationery", "Like New" pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.tags[0] || item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.condition}
                  </span>
                </div>

                {/* Seller and Hostel */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.sellerName}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.hostelName}</span>
                  </span>
                </div>
              </div>

              {/* Right: Bold Blue Price */}
              <div className="shrink-0 text-right">
                <span className={`text-base font-extrabold ${isSold ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-[#2563EB] dark:text-cyan-400'}`}>
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          );
        })}

        {filteredResults.length === 0 && (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No items found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Try searching for popular campus supplies:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-xs mx-auto">
              {['drafter', 'calculator', 'lab coat', 'python', 'cycle'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectRecentSearch(sug)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#4F46E5] dark:text-cyan-400 font-medium transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sold Item Unavailable Notice Modal */}
      {soldItemNotice && (
        <div 
          onClick={() => setSoldItemNotice(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs border border-amber-200 dark:border-amber-800/60">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
                Sold Out
              </div>
              <h3 className="text-lg font-black text-[#0F172A] dark:text-white">
                Item Not Available
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Item not available at the moment, Please check again after some time or post a request
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                <ItemVisual
                  title={soldItemNotice.title}
                  category={soldItemNotice.category}
                  tags={soldItemNotice.tags}
                  imageUrl={soldItemNotice.imageUrl}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {soldItemNotice.title}
                </h4>
                <span className="text-xs font-extrabold text-[#2563EB] dark:text-cyan-400">
                  ₹{soldItemNotice.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {soldItemNotice.hostelName}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSoldItemNotice(null);
                  onOpenCreateRequest?.();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Post a Request for this Item</span>
              </button>

              <button
                type="button"
                onClick={() => setSoldItemNotice(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
