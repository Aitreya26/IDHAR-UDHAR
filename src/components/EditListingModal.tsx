import React, { useState, useRef, useEffect } from 'react';
import { Listing, CategoryType, ListingType, RentPeriod, ListingCondition, UserProfile } from '../types';
import { 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Tag, 
  HelpCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Bell, 
  Loader2 
} from 'lucide-react';

interface EditListingModalProps {
  currentUser: UserProfile;
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedListing: Listing) => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  currentUser,
  listing,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [listingType, setListingType] = useState<ListingType>('sell');
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>('month');
  const [rentDueDate, setRentDueDate] = useState<string>('');
  const [rentDurationDays, setRentDurationDays] = useState<number>(14);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [reasonForSelling, setReasonForSelling] = useState('');
  const [category, setCategory] = useState<CategoryType>('Books');
  const [condition, setCondition] = useState<ListingCondition>('Like New');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Attached Photo state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setPrice(listing.price !== undefined ? String(listing.price) : '');
      setCostPrice(listing.originalCostPrice ? String(listing.originalCostPrice) : '');
      setCategory(listing.category || 'Books');
      setCondition(listing.condition || 'Like New');
      setDescription(listing.description || '');
      setReasonForSelling(listing.reasonForSelling || '');
      setListingType(listing.listingType || 'sell');
      setRentPeriod(listing.rentPeriod || 'month');
      setRentDueDate(listing.rentDueDate || '');
      setRentDurationDays(listing.rentDurationDays || 14);
      setImageUrl(listing.imageUrl || '');
      setImageFileName(listing.imageUrl ? 'current-photo.jpg' : '');
      setFormError('');
    }
  }, [listing, isOpen]);

  if (!isOpen || !listing) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFileName(file.name);
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (!rawUrl) {
          setIsProcessingImage(false);
          return;
        }
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setImageUrl(compressed);
          setIsProcessingImage(false);
        };
        img.onerror = () => {
          setImageUrl(rawUrl);
          setIsProcessingImage(false);
        };
        img.src = rawUrl;
      };
      reader.onerror = () => {
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setImageUrl('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Please enter a title for your item.');
      return;
    }

    if (listingType === 'rent') {
      if (!rentDueDate) {
        setFormError('Please select a return due date for this rental item.');
        return;
      }
    }

    const rawPriceNum = parseInt(price, 10);
    const numericPrice = isNaN(rawPriceNum) 
      ? listing.price 
      : Math.min(10000000, Math.max(0, rawPriceNum));

    const numericCostPrice = costPrice.trim() 
      ? Math.min(10000000, Math.max(0, parseInt(costPrice, 10) || 0)) 
      : undefined;

    const updatedListing: Listing = {
      ...listing,
      title: title.trim(),
      description: description.trim() || `College essential available in ${currentUser.hostelName}.`,
      price: numericPrice,
      originalCostPrice: numericCostPrice,
      reasonForSelling: reasonForSelling.trim() || undefined,
      listingType,
      rentPeriod: listingType === 'rent' ? rentPeriod : undefined,
      rentDueDate: listingType === 'rent' ? rentDueDate : undefined,
      rentDurationDays: listingType === 'rent' ? rentDurationDays : undefined,
      category,
      condition,
      imageUrl: imageUrl.trim() || undefined,
      tags: [category, condition],
    };

    onUpdate(updatedListing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto space-y-5 select-none transition-colors duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-[#0F172A] dark:text-white">Edit Listing</h2>
            <span className="text-[11px] text-slate-400">Update item details, price, or photo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Upload Area */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessingImage ? (
              <div className="w-full py-7 px-4 rounded-2xl border-2 border-dashed border-[#C7D2FE] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 text-[#4F46E5] dark:text-cyan-400 animate-spin" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Compressing & optimizing image...
                </span>
              </div>
            ) : !imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-7 px-4 rounded-2xl border-2 border-dashed border-[#C7D2FE] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 hover:bg-[#EEF2FF]/50 dark:hover:bg-slate-800/80 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-[#E0E7FF] dark:border-slate-700 flex items-center justify-center text-[#4F46E5] dark:text-cyan-400 shadow-sm group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="text-sm font-bold text-[#4F46E5] dark:text-cyan-400 block">
                    Upload new photo
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                    Tap to select and optimize photo
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#C7D2FE] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 p-2 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Uploaded item"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                    {imageFileName || 'item-photo.jpg'}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" />
                    <span>Photo attached</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ITEM TITLE */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              ITEM TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Year Drafter with Compass"
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* PRICE & CATEGORY Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span>SELLING PRICE (₹) *</span>
                <span className="text-[9px] text-slate-400 font-normal">Max ₹1 Cr</span>
              </label>
              <input
                type="number"
                min="0"
                max="10000000"
                required
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || parseInt(val, 10) <= 10000000) {
                    setPrice(val);
                  }
                }}
                placeholder="250"
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 cursor-pointer"
              >
                <option value="Books">Books</option>
                <option value="Drafters & Tools">Drafters & Tools</option>
                <option value="Lab Gear">Lab Gear</option>
                <option value="Electronics">Electronics</option>
                <option value="Sports and Fitness">Sports and Fitness</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#4F46E5] dark:text-cyan-400" />
                <span>Cost Price / Original Purchase Price (₹)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="number"
              min="0"
              max="10000000"
              value={costPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || parseInt(val, 10) <= 10000000) {
                  setCostPrice(val);
                }
              }}
              placeholder="e.g. 600"
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 font-mono"
            />
            {(() => {
              const numPrice = parseInt(price, 10);
              const numCost = parseInt(costPrice, 10);
              const isValidDiscount =
                !isNaN(numPrice) &&
                !isNaN(numCost) &&
                numCost > 0 &&
                numPrice >= 0 &&
                numCost > numPrice;

              if (!isValidDiscount) return null;

              const discountDiff = numCost - numPrice;
              const discountPercent = Math.round((discountDiff / numCost) * 100);

              return (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                  ✓ Showing a discount of ₹{discountDiff} ({discountPercent}% off) to campus buyers!
                </span>
              );
            })()}
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              ITEM CONDITION
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Like New', 'Good', 'Fair', 'Rough'] as ListingCondition[]).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                    condition === cond
                      ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-500'
                      : 'bg-[#F8FAFC] dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Reason for selling */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#4F46E5] dark:text-cyan-400" />
                <span>Reason For Selling</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="text"
              value={reasonForSelling}
              onChange={(e) => setReasonForSelling(e.target.value)}
              placeholder="e.g. Semester ended, graduated, upgraded equipment"
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details or items included? Mention hostel handover availability."
              className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-[#4F46E5] dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-800 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessingImage}
              className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingImage}
              className="flex-2 py-3.5 px-6 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isProcessingImage ? 'Processing Image...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
