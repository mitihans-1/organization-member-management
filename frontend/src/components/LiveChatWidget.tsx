import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: config } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => api.get('/admin/system-config').then((r) => r.data),
  });

  if (!config?.showLiveChat || !config?.liveChatUrl) return null;

  const handleChatClick = () => {
    // If it's a direct link (like WhatsApp or a chat page), open in new tab
    if (config.liveChatUrl.startsWith('http')) {
      window.open(config.liveChatUrl, '_blank');
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && !config.liveChatUrl.startsWith('http') && (
        <div className="w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-sky-600 p-4 flex items-center justify-between text-white">
            <div>
              <h4 className="font-bold text-sm">Live Support</h4>
              <p className="text-[10px] opacity-80">We're online to help</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 bg-slate-50 relative">
            <iframe 
              src={config.liveChatUrl} 
              className="w-full h-full border-none"
              title="Chat Window"
            />
          </div>
        </div>
      )}
      
      <button
        onClick={handleChatClick}
        className="w-14 h-14 rounded-full bg-sky-600 text-white shadow-lg shadow-sky-200 flex items-center justify-center hover:bg-sky-500 hover:scale-110 active:scale-95 transition-all group relative"
        aria-label="Open chat"
      >
        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
      </button>
    </div>
  );
};

export default LiveChatWidget;
