import React, { useState } from 'react';
import { Listing, CampusRequest, UserProfile, ExchangeSession } from '../types';
import { ItemVisual } from './ItemVisual';
import { getSellerReputation } from '../data/reputation';
import { getRentalDueStatus } from './ExchangesFeed';
import { chatService } from '../utils/chatService';
import { COLLEGES } from '../data/colleges';
import { deleteFirestoreUserProfile } from '../firebase';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Edit3, 
  Pencil,
  Camera,
  Upload,
  Lock,
  X,
  LogOut, 
  CheckCircle2, 
  Trash2,
  Tag,
  AlertTriangle,
  Star,
  Calendar,
  Clock,
  Bell,
  Check
} from 'lucide-react';

interface MyListingsViewProps {
  currentUser: UserProfile;
  listings: Listing[];
  requests: CampusRequest[];
  exchanges?: ExchangeSession[];
  isGuest?: boolean;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onDeleteListing: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleListingStatus: (id: string) => void;
  onOpenCreateListing: () => void;
  onOpenCreateRequest: () => void;
  onLogout: () => void;
  onRequireAuth?: (intent: 'sell' | 'general') => void;
  onSendRentalReminder?: (exchange: ExchangeSession) => void;
}

export const MyListingsView: React.FC<MyListingsViewProps> = ({
  currentUser,
  listings,
  requests,
  exchanges = [],
  isGuest = false,
  onUpdateUser,
  onDeleteListing,
  onDeleteRequest,
  onToggleListingStatus,
  onOpenCreateListing,
  onOpenCreateRequest,
  onLogout,
  onRequireAuth,
  onSendRentalReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'drafts'>('active');
  const [editingRoom, setEditingRoom] = useState(false);
  const [roomInput, setRoomInput] = useState(currentUser.roomNumber);
  const [sentReminders, setSentReminders] = useState<Record<string, boolean>>({});

  // Account Deletion states
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Comprehensive Profile Editing states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser.fullName);
  const [editRollNumber, setEditRollNumber] = useState(currentUser.rollNumber || '');
  const [editCourse, setEditCourse] = useState(currentUser.course || 'B.Tech CSE');
  const [editYear, setEditYear] = useState(currentUser.year || '2nd Year');
  const [editHostel, setEditHostel] = useState(currentUser.hostelName);
  const [editRoom, setEditRoom] = useState(currentUser.roomNumber);
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(currentUser.avatarUrl || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const handleOpenEditProfile = () => {
    setEditFullName(currentUser.fullName);
    setEditRollNumber(currentUser.rollNumber || '');
    setEditCourse(currentUser.course || 'B.Tech CSE');
    setEditYear(currentUser.year || '2nd Year');
    setEditHostel(currentUser.hostelName);
    setEditRoom(currentUser.roomNumber);
    setEditPhone(currentUser.phone);
    setEditAvatarUrl(currentUser.avatarUrl || '');
    setProfileSaveSuccess(false);
    setIsEditProfileOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditAvatarUrl(result);
      if (!isEditProfileOpen) {
        onUpdateUser({
          ...currentUser,
          avatarUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      fullName: currentUser.fullName,
      rollNumber: currentUser.rollNumber,
      phone: currentUser.phone,
      course: editCourse.trim() || currentUser.course,
      year: editYear || currentUser.year,
      hostelName: editHostel || currentUser.hostelName,
      roomNumber: editRoom.trim() || currentUser.roomNumber,
      avatarUrl: editAvatarUrl || undefined,
    };
    onUpdateUser(updated);
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setIsEditProfileOpen(false);
      setProfileSaveSuccess(false);
    }, 600);
  };

  const handleSendReminder = (exchange: ExchangeSession) => {
    const status = getRentalDueStatus(exchange.rentDueDate);
    const dueDateStr = status ? status.formattedDate : exchange.rentDueDate || 'soon';
    const daysRemaining = status ? status.diffDays : 0;

    chatService.sendRentalReminder({
      exchangeId: exchange.id,
      listingId: exchange.listingId,
      listingTitle: exchange.listingTitle,
      sellerId: exchange.sellerId,
      sellerName: exchange.sellerName,
      buyerId: exchange.buyerId,
      buyerName: exchange.buyerName,
      rentDueDate: dueDateStr,
      daysRemaining,
    });

    chatService.sendMessage({
      threadId: `thread-${exchange.listingId}-${exchange.buyerId}`,
      listingId: exchange.listingId,
      listingTitle: exchange.listingTitle,
      listingPrice: exchange.price,
      senderId: exchange.sellerId,
      senderName: exchange.sellerName,
      receiverId: exchange.buyerId,
      receiverName: exchange.buyerName,
      text: `⏰ Friendly Reminder: The rental period for "${exchange.listingTitle}" is due on ${dueDateStr}. Please let me know when and where we can meet near UIET campus for the return handover. Thanks!`,
    });

    onSendRentalReminder?.(exchange);
    setSentReminders((prev) => ({ ...prev, [exchange.id]: true }));
    setTimeout(() => {
      setSentReminders((prev) => ({ ...prev, [exchange.id]: false }));
    }, 4000);
  };

  const myListings = listings.filter(l => l.sellerId === currentUser.id);
  const activeListings = myListings.filter(l => l.status !== 'completed');
  const soldListings = myListings.filter(l => l.status === 'completed');

  const myExchanges = exchanges.filter(
    (ex) => ex.buyerId === currentUser.id || ex.sellerId === currentUser.id
  );
  const myRequests = requests.filter(
    (r) => r.requesterId === currentUser.id
  );

  const reputation = getSellerReputation(currentUser.id);

  const handleSaveRoom = () => {
    onUpdateUser({
      ...currentUser,
      roomNumber: roomInput,
    });
    setEditingRoom(false);
  };

  return (
    <div className="w-full bg-[#F8FAFC] dark:bg-[#0A0A0A] select-none pb-14 transition-colors duration-200">
      {/* 1. Curved Indigo Banner & Profile Card matching Screenshot 10 */}
      <div className="relative bg-[#4F46E5] dark:bg-gradient-to-r dark:from-[#312E81] dark:via-[#1E1B4B] dark:to-[#0F172A] text-white pt-8 pb-10 px-6 rounded-b-[36px] flex flex-col items-center text-center shadow-md">
        {/* Large Avatar Circle with Photo upload button */}
        <div className="relative mb-3 group">
          <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center shadow-inner overflow-hidden">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/15 text-white/80">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>
          {/* Direct Camera / Photo Upload trigger */}
          <label
            htmlFor="profile-avatar-direct-upload"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-[#4F46E5] dark:text-cyan-400 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
            title="Upload Profile Photo"
          >
            <Camera className="w-4 h-4" />
            <input
              id="profile-avatar-direct-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* User Name & Pencil Edit Profile button */}
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white">
            {currentUser.fullName}
          </h2>
          <button
            onClick={handleOpenEditProfile}
            className="ml-1 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 active:scale-95 shadow-xs"
            title="Edit Profile"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
            <span>Edit</span>
          </button>
        </div>

        {/* Course & Year */}
        <p className="text-xs text-indigo-100 dark:text-slate-300 font-medium mt-1">
          {currentUser.course || 'B.Tech CS'} • {currentUser.year || '2nd Year'}
        </p>

        {/* TRUSTWORTHY SELLER Badge if continuously rated 4+ stars for 10+ times */}
        {reputation.isTrustworthy && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>TRUSTWORTHY SELLER</span>
          </div>
        )}

        {/* Reputation mini stats without streak */}
        {reputation.ratingsCount > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-indigo-100 dark:text-slate-300">
            <span className="flex items-center gap-0.5 font-bold">
              <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>{reputation.averageRating.toFixed(1)}</span>
              <span className="font-normal opacity-80">({reputation.ratingsCount} ratings)</span>
            </span>
          </div>
        )}

        {/* Hostel Location Pill matching Screenshot 10 */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
          <MapPin className="w-3 h-3 text-indigo-200 dark:text-cyan-300" />
          <span>{currentUser.hostelName}</span>
          <span>·</span>
          <span>{currentUser.roomNumber}</span>
          <button 
            onClick={() => setEditingRoom(!editingRoom)} 
            className="ml-1 text-indigo-200 hover:text-white cursor-pointer"
            title="Edit room"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>

        {editingRoom && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white text-slate-800 text-xs font-medium focus:outline-none"
              placeholder="e.g. Room 214"
            />
            <button
              onClick={handleSaveRoom}
              className="px-3 py-1 rounded-lg bg-white text-[#4F46E5] font-bold text-xs cursor-pointer"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Requirement: 1-Star Suspension Warning if seller rated 1 star for 5 times or more */}
      {reputation.hasOneStarWarning && (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500/50 text-rose-800 dark:text-rose-200 space-y-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Seller Account Notice</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-100 leading-snug">
            "You were constantly rated as 1, please review products to avoid suspension"
          </p>
          <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 pt-1 border-t border-rose-200 dark:border-rose-900/60 font-medium">
            <span>Low ratings received: {reputation.oneStarCount} (1★)</span>
            <span className="underline">UIET Campus Marketplace Safety Rule</span>
          </div>
        </div>
      )}

      {/* 2. Segmented Pill Tabs matching Screenshot 10: Active (2) | Sold (5) | Drafts */}
      <div className="px-5 -mt-5 relative z-10">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#EEF2FF] dark:bg-slate-800 text-[#4F46E5] dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Active ({activeListings.length})
          </button>

          <button
            onClick={() => setActiveTab('sold')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sold'
                ? 'bg-[#EEF2FF] dark:bg-slate-800 text-[#4F46E5] dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sold ({soldListings.length})
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 py-2 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'drafts'
                ? 'bg-[#EEF2FF] dark:bg-slate-800 text-[#4F46E5] dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Rentals & Handovers ({myExchanges.length})
          </button>
        </div>
      </div>

      {/* 3. Items List matching Screenshot 10 */}
      <div className="p-5 space-y-3">
        {activeTab === 'active' && activeListings.map((item) => {
          const activeExchange = exchanges.find(
            (e) => e.listingId === item.id && e.status !== 'completed' && e.status !== 'cancelled'
          );

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-900">
                  <ItemVisual
                    title={item.title}
                    category={item.category}
                    tags={item.tags}
                    imageUrl={item.imageUrl}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#2563EB] dark:text-cyan-400">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    {item.listingType === 'rent' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-cyan-950/60 text-[#4F46E5] dark:text-cyan-300 border border-indigo-100 dark:border-cyan-900/40 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>Rent/{item.rentPeriod || 'term'}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {item.createdAt}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => onToggleListingStatus(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/60 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Mark as Sold
                  </button>
                  <button
                    onClick={() => onDeleteListing(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rental Return Due Date & Active Renter Reminder Notice */}
              {item.listingType === 'rent' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {item.rentDueDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#4F46E5] dark:text-cyan-400" />
                        <span>Scheduled Return Due Date:</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {new Date(item.rentDueDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Kolkata',
                        })}
                      </strong>
                    </div>
                  )}

                  {activeExchange && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2 mt-1">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Active Borrower
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                          {activeExchange.buyerName} ({activeExchange.buyerHostel})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendReminder(activeExchange)}
                        className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer shrink-0"
                      >
                        {sentReminders[activeExchange.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Reminder Sent!</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5" />
                            <span>Remind Renter</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {activeTab === 'sold' && soldListings.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 opacity-80 flex items-center justify-between gap-3"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-900">
              <ItemVisual
                title={item.title}
                category={item.category}
                tags={item.tags}
                imageUrl={item.imageUrl}
                className="w-full h-full"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white line-through text-slate-400">
                {item.title}
              </h4>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Sold for ₹{item.price}
              </span>
            </div>

            <button
              onClick={() => onToggleListingStatus(item.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
            >
              Relist
            </button>
          </div>
        ))}

        {activeTab === 'drafts' && (
          <div className="space-y-4">
            {/* Rentals & Handovers List */}
            {myExchanges.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    My Rentals & Handover Sessions ({myExchanges.length})
                  </h3>
                  <span className="text-[10px] font-bold text-[#4F46E5] dark:text-cyan-400">
                    Live Status
                  </span>
                </div>

                {myExchanges.map((ex) => {
                  const isSeller = currentUser.id === ex.sellerId;
                  const isCompleted = ex.status === 'completed';
                  const dueStatus = getRentalDueStatus(ex.rentDueDate);

                  return (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSeller
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {isSeller ? `Lent by You to ${ex.buyerName}` : `Borrowed by You from ${ex.sellerName}`}
                            </span>

                            {isCompleted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                ✓ Handover Completed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                Handover Active
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                            {ex.listingTitle}
                          </h4>

                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            <span className="text-slate-900 dark:text-slate-100 font-bold">₹{ex.price}</span>
                            {ex.securityDeposit ? (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                                (+₹{ex.securityDeposit} refundable deposit)
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Rental Due Date & Countdown Status */}
                      {ex.rentDueDate && dueStatus && (
                        <div
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            dueStatus.isOverdue
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                              : dueStatus.isDueToday
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                              : dueStatus.isDueSoon
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-200'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>
                              {dueStatus.isOverdue
                                ? `⚠️ Return Overdue by ${Math.abs(dueStatus.diffDays)} days (${dueStatus.formattedDate})`
                                : dueStatus.isDueToday
                                ? `🚨 Return Due Today! (${dueStatus.formattedDate})`
                                : dueStatus.isDueTomorrow
                                ? `⏰ Due Tomorrow (1 day left) • ${dueStatus.formattedDate}`
                                : dueStatus.isDueIn2Days
                                ? `⏰ Due in 2 Days • ${dueStatus.formattedDate}`
                                : `Return Due: ${dueStatus.formattedDate} (${dueStatus.diffDays} days left)`}
                            </span>
                          </div>

                          {/* Lender Reminder Button */}
                          {isSeller && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(ex)}
                              className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                            >
                              {sentReminders[ex.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Reminder Sent!</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3.5 h-3.5" />
                                  <span>Remind Renter</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Buyer reminder note */}
                      {!isSeller && !isCompleted && ex.rentDueDate && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          💡 <strong>Renter Notice:</strong> Return this item on time to {ex.sellerName} at UIET campus to release and reclaim your full refundable security deposit.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Campus Need Requests */}
            {myRequests.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    My Campus Need Requests ({myRequests.length})
                  </h3>
                  <button
                    onClick={onOpenCreateRequest}
                    className="text-[10px] font-bold text-[#4F46E5] dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    + Request an Item
                  </button>
                </div>

                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-cyan-400">
                          {req.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Budget: ₹{req.maxBudget}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {req.title}
                      </h4>
                      {req.urgency && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Urgency: {req.urgency}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteRequest(req.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      title="Delete request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state when no exchanges and no requests */}
            {myExchanges.length === 0 && myRequests.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#4F46E5] dark:text-cyan-400">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Active Rentals or Handover Sessions
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  When you rent or lend books, mini drafters, or lab kits, your return countdowns, security deposits, and handover PINs will appear right here.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={onOpenCreateListing}
                    className="px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    List for Rent
                  </button>
                  <button
                    onClick={onOpenCreateRequest}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Post Need Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Logout & Account Settings */}
        <div className="pt-4 space-y-3">
          <button
            onClick={onLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Log Out of Campus ID</span>
          </button>

          {/* Danger Zone: Permanent Account Deletion (Disabled for Campus Admin) */}
          {!isGuest && !currentUser.isAdmin && (
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Danger Zone</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Permanently delete your campus student account, active listings, and community requests. This action cannot be reversed.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setIsDeleteAccountOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Comprehensive Edit Student Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#4F46E5] dark:text-cyan-400 font-black text-sm uppercase tracking-wide">
                <Pencil className="w-4 h-4" />
                <span>Edit Student Profile</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Campus Credentials Locked Notice */}
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    Campus Identity Locked
                  </span>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Full Name, Roll Number, and Mobile Phone cannot be edited to safeguard campus peer exchanges. For corrections, contact the Chief Proctor.
                  </p>
                </div>
              </div>

              {/* Photo Upload & Preview Section */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-[#4F46E5] dark:border-cyan-400 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs flex items-center justify-center">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl('')}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Reset Photo
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Attach your campus student photo (JPG, PNG or WebP)
                </p>
              </div>

              {/* Full Name (Locked) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Full Name
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={currentUser.fullName}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-not-allowed select-none"
                  title="Full Name cannot be edited once registered"
                />
              </div>

              {/* Roll Number (Locked) & Academic Year (Editable) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Roll Number
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={currentUser.rollNumber || 'Not set'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold cursor-not-allowed select-none"
                    title="Roll Number cannot be edited once registered"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Course / Branch */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Course / Branch
                </label>
                <input
                  type="text"
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  placeholder="e.g. B.Tech CSE"
                />
              </div>

              {/* Hostel & Room Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Hostel / Living Status
                  </label>
                  <select
                    value={editHostel}
                    onChange={(e) => {
                      setEditHostel(e.target.value);
                      if (e.target.value === 'Day Scholar' && !editRoom) {
                        setEditRoom('Day Scholar');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    {COLLEGES[0]?.hostels.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {editHostel === 'Day Scholar' ? 'Area / Locality' : 'Room Number'}
                  </label>
                  <input
                    type="text"
                    required={editHostel !== 'Day Scholar'}
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    placeholder={editHostel === 'Day Scholar' ? 'e.g. Local (Day Scholar)' : 'e.g. Room 108'}
                  />
                </div>
              </div>

              {/* Mobile Phone Number (Locked) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Mobile Phone Number
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                </div>
                <input
                  type="tel"
                  disabled
                  readOnly
                  value={currentUser.phone}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold cursor-not-allowed select-none"
                  title="Mobile Phone cannot be edited once registered"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#4F46E5] hover:bg-indigo-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {profileSaveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {isDeleteAccountOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950/50 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A] dark:text-white">Delete Student Account</h3>
                  <p className="text-[11px] text-slate-400">Permanent Campus Network Wipe</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeleting) setIsDeleteAccountOpen(false);
                }}
                disabled={isDeleting}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-300 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Warning: Irreversible Action</span>
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                This action is permanent and cannot be undone. All your active listings, campus requests, and your profile data will be permanently wiped from the campus network.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">Confirm</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'Confirm' to proceed"
                disabled={isDeleting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmText !== 'Confirm' || isDeleting) return;
                  setIsDeleting(true);
                  try {
                    await fetch(`/api/users/${currentUser.id}`, { method: 'DELETE' });
                    await deleteFirestoreUserProfile(currentUser.id);
                  } catch (err) {
                    console.warn('Account deletion error:', err);
                  } finally {
                    setIsDeleting(false);
                    setIsDeleteAccountOpen(false);
                    onLogout();
                  }
                }}
                disabled={deleteConfirmText !== 'Confirm' || isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
