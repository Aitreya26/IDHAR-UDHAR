import React, { useState } from 'react';
import { Listing, CategoryType, UserProfile, CampusAnnouncement } from '../types';
import { ItemVisual } from './ItemVisual';
import { getSellerReputation } from '../data/reputation';
import { 
  Search, 
  BookOpen, 
  Store, 
  PenTool, 
  Laptop, 
  Sparkles,
  Maximize2,
  Dumbbell,
  Headphones,
  SlidersHorizontal,
  ShieldCheck,
  AlertCircle,
  Bell,
  User
} from 'lucide-react';

interface MarketplaceFeedProps {
  listings: Listing[];
  currentUser: UserProfile;
  announcements?: CampusAnnouncement[];
  onSelectListing: (listing: Listing) => void;
  onOpenSearch: () => void;
  onSelectCategory: (category: CategoryType) => void;
  onOpenFullPhoto?: (listing: Listing) => void;
  onOpenCreateRequest?: () => void;
}

export const MarketplaceFeed: React.FC<MarketplaceFeedProps> = ({
  listings,
  currentUser,
  announcements = [],
  onSelectListing,
  onOpenSearch,
  onSelectCategory,
  onOpenFullPhoto,
  onOpenCreateRequest,
}) => {
  const [selectedCat, setSelectedCat] = useState<CategoryType | 'All'>('All');
  const [soldItemNotice, setSoldItemNotice] = useState<Listing | null>(null);

  const categories: { label: CategoryType; icon: React.ReactNode; bg: string; color: string }[] = [
    { label: 'Books', icon: <BookOpen className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Drafters & Tools', icon: <PenTool className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Lab Gear', icon: <Store className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Electronics', icon: <Laptop className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Sports and Fitness', icon: <Dumbbell className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Accessories', icon: <Headphones className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
    { label: 'Other', icon: <Sparkles className="w-5 h-5 text-[#4F46E5] dark:text-cyan-400" />, bg: 'bg-[#EEF2FF] dark:bg-slate-800', color: 'text-[#4F46E5] dark:text-cyan-400' },
  ];

  const displayedListings = selectedCat === 'All' 
    ? listings 
    : listings.filter(l => l.category === selectedCat);

  return (
    <div className="w-full space-y-6 pb-12 select-none">
      {/* 0. Campus-Wide Announcements Banner */}
      {announcements && announcements.length > 0 && (
        <div className="px-5 pt-3 space-y-2.5">
          {announcements.map((ann) => {
            const priorityStyles =
              ann.priority === 'urgent'
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/20'
                : ann.priority === 'high'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20';

            return (
              <div
                key={ann.id}
                className={`p-3.5 rounded-2xl ${priorityStyles} transition-all border border-black/10`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>{ann.adminName || 'Chief Proctor Office'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-current font-bold uppercase">
                      {ann.priority}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-80 font-mono">
                    {new Date(ann.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                  {ann.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Search Bar */}
      <div className="px-5 pt-3">
        <div 
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#F1F5F9] dark:bg-slate-800/80 hover:bg-[#E2E8F0]/70 dark:hover:bg-slate-700/80 rounded-2xl cursor-pointer transition-colors border border-transparent dark:border-slate-700 shadow-2xs"
        >
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-normal truncate">
            Search books, drafters, sports, electronics...
          </span>
        </div>
      </div>

      {/* 2. Browse Categories with Sports & Fitness, Accessories, Other */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-1.5">
            <span>Browse Categories</span>
            {selectedCat !== 'All' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-cyan-400 font-bold">
                {selectedCat}
              </span>
            )}
          </h2>
          {selectedCat !== 'All' ? (
            <button 
              onClick={() => {
                setSelectedCat('All');
                onSelectCategory('Books'); // reset filter
              }} 
              className="text-xs text-[#4F46E5] dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          ) : null}
        </div>

        {/* Scrollable / Multi-row Categories Grid */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <button
            onClick={() => {
              setSelectedCat('All');
            }}
            className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              selectedCat === 'All'
                ? 'bg-[#4F46E5] dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:scale-105 border border-transparent dark:border-slate-700'
            }`}>
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-semibold text-center leading-tight whitespace-nowrap ${
              selectedCat === 'All' ? 'text-[#4F46E5] dark:text-cyan-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}>
              All Items
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCat === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => {
                  setSelectedCat(isSelected ? 'All' : cat.label);
                  onSelectCategory(cat.label);
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer shrink-0"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-[#4F46E5] dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md scale-105' 
                    : `${cat.bg} group-hover:scale-105 shadow-2xs border border-transparent dark:border-slate-700`
                }`}>
                  {React.isValidElement(cat.icon) ? (
                    React.cloneElement(cat.icon as React.ReactElement<any>, {
                      className: `w-5 h-5 ${isSelected ? 'text-white dark:text-slate-950' : 'text-[#4F46E5] dark:text-cyan-400'}`
                    })
                  ) : cat.icon}
                </div>
                <span className={`text-[11px] font-semibold text-center leading-tight whitespace-nowrap max-w-[80px] truncate ${
                  isSelected ? 'text-[#4F46E5] dark:text-cyan-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hot Deals Banner */}
      <div className="px-5">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#6366F1] via-[#5A58EC] to-[#4F46E5] dark:from-[#312E81] dark:via-[#1E1B4B] dark:to-[#0F172A] dark:border dark:border-indigo-500/30 p-5 text-white overflow-hidden shadow-lg">
          <div className="relative z-10 space-y-1.5 w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wide">
              <span>CAMPUS EXCHANGE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight text-balance">
              Pre-Owned Semester Essentials
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 dark:text-slate-300 font-medium leading-relaxed text-pretty">
              Buy, sell, or rent books, drafters, and gear with direct handovers at the Nescafé Booth & UIET Hostels.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recently Listed with Full Photo Button (Requirement B) */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0F172A] dark:text-white">
            Recently Listed ({displayedListings.length})
          </h2>
          <button 
            onClick={onOpenSearch} 
            className="text-xs text-[#4F46E5] dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
          >
            Search feed
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {displayedListings.map((item) => {
            const isSold = item.status === 'completed';

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isSold) {
                    setSoldItemNotice(item);
                  } else {
                    onSelectListing(item);
                  }
                }}
                className={`rounded-2xl border p-2.5 shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isSold
                    ? 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800 hover:shadow-md'
                }`}
              >
                {/* Media area with Full Photo Button & Slanted SOLD Ribbon */}
                <div className={`relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center ${isSold ? 'grayscale contrast-75 brightness-90' : ''}`}>
                  <ItemVisual
                    title={item.title}
                    category={item.category}
                    tags={item.tags}
                    imageUrl={item.imageUrl}
                    className="w-full h-full"
                  />

                  {/* Dark grey tint overlay for sold items */}
                  {isSold && (
                    <div className="absolute inset-0 bg-slate-900/25 pointer-events-none z-10" />
                  )}

                  {/* Slanted SOLD Ribbon on Image */}
                  {isSold && (
                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
                      <div className="absolute transform rotate-45 bg-red-600 text-white font-black text-[10px] sm:text-xs py-1 right-[-32px] top-[18px] w-[115px] text-center shadow-lg uppercase tracking-widest border-y border-white/30 select-none">
                        SOLD
                      </div>
                    </div>
                  )}

                  {/* Full Photo Button (only if not sold) */}
                  {!isSold && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFullPhoto?.(item);
                      }}
                      className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-black/65 hover:bg-black/90 text-white backdrop-blur-xs text-[10px] font-bold shadow-md flex items-center gap-1 transition-all cursor-pointer border border-white/20 active:scale-95"
                      title="View full uncropped photo"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-300" />
                      <span className="hidden sm:inline">Full View</span>
                    </button>
                  )}

                  {/* Badge top-right: Condition (only if not sold) */}
                  {!isSold && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-xs border border-slate-100 dark:border-slate-700">
                        {item.condition}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Meta */}
                <div className="pt-2.5 px-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs sm:text-sm font-bold truncate flex-1 ${
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

                  <div className="flex items-baseline justify-between">
                    <span className={`text-sm font-extrabold ${isSold ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-[#2563EB] dark:text-cyan-400'}`}>
                      ₹{item.price.toLocaleString('en-IN')}
                      {item.listingType === 'rent' && (
                        <span className="text-[10px] text-slate-400 font-normal">/{item.rentPeriod || 'mo'}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[80px]">
                      {item.hostelName.replace(' Bhawan', '')}
                    </span>
                  </div>

                  {/* Seller Name (Replacing saved %, cut-out original price, and trustworthy seller tag) */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                    <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium truncate">{item.sellerName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                Browse Other Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
