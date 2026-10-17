import React from 'react';
import { PushNotificationAlert } from '../types';
import { Bell, X, MapPin, MessageSquare, ArrowRight } from 'lucide-react';

interface NotificationToastProps {
  notification: PushNotificationAlert | null;
  onDismiss: () => void;
  onViewRequest: (requestId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onViewRequest,
}) => {
  if (!notification) return null;

  const isRentalReminder = notification.id.startsWith('rental-rem-') || notification.id.startsWith('auto-rental-rem-');
  const isChatMessage = notification.id.startsWith('chat-');

  return (
    <div className={`fixed top-16 sm:top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md rounded-3xl p-4 text-slate-800 dark:text-slate-100 animate-in slide-in-from-top-4 duration-300 select-none shadow-2xl ${
      isRentalReminder
        ? 'border-2 border-amber-400 dark:border-amber-500 shadow-[0_12px_36px_rgba(245,158,11,0.22)]'
        : 'border border-[#C7D2FE] dark:border-slate-700 shadow-[0_12px_36px_rgba(79,70,229,0.18)]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {notification.imageUrl ? (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-[#C7D2FE] dark:border-slate-700 overflow-hidden shrink-0 relative flex items-center justify-center">
            <img
              src={notification.imageUrl}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className={`absolute bottom-0 right-0 p-0.5 rounded-tl ${isRentalReminder ? 'bg-amber-500' : 'bg-[#4F46E5]'}`}>
              <Bell className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 animate-pulse ${
            isRentalReminder 
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400' 
              : 'bg-[#EEF2FF] dark:bg-indigo-950/50 border-[#C7D2FE] dark:border-indigo-800 text-[#4F46E5] dark:text-cyan-400'
          }`}>
            <Bell className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-black ${
              isRentalReminder 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-[#4F46E5] dark:text-cyan-400'
            }`}>
              {isRentalReminder ? '⏰ RENTAL RETURN REMINDER' : isChatMessage ? '💬 LIVE CHAT MESSAGE' : 'HOSTEL RADAR ALERT'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {notification.timestamp}
            </span>
          </div>

          <h4 className="text-xs font-bold text-[#0F172A] dark:text-white leading-snug truncate">
            {notification.title}
          </h4>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">
            {notification.body}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
            <MapPin className={`w-3 h-3 ${isRentalReminder ? 'text-amber-500' : 'text-[#4F46E5] dark:text-cyan-400'}`} />
            <span className="font-bold text-slate-800 dark:text-slate-200">{notification.requesterName}</span>
            <span className="text-slate-400 text-[10px]">({notification.hostelName}{notification.roomNumber ? `, ${notification.roomNumber}` : ''})</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {notification.requesterPhone ? (
          <a
            href={`https://wa.me/91${notification.requesterPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
              isRentalReminder
                ? `Hi ${notification.requesterName}! I received the rental reminder on IDHAR UDHAR. I am ready for the return handover. Let's coordinate!`
                : `Hi ${notification.requesterName}! I received your IDHAR UDHAR hostel alert. I have this item available in my room!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-bold"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Reply WhatsApp</span>
          </a>
        ) : <div />}

        <button
          onClick={() => {
            onViewRequest(notification.requestId);
            onDismiss();
          }}
          className={`text-xs px-3 py-1.5 rounded-xl text-white font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            isRentalReminder 
              ? 'bg-amber-500 hover:bg-amber-600 shadow-xs' 
              : 'bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950'
          }`}
        >
          <span>{isRentalReminder ? 'View Return Handover' : isChatMessage ? 'Open Live Chat' : 'View Request'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
