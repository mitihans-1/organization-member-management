import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  Mail,
  Link as LinkIcon,
  Tag
} from 'lucide-react';
import { Event } from '../types';
import CoverImage from './CoverImage';

interface EventDetailsModalProps {
  event: Event;
  events?: Event[]; // Provide to let CoverImage index if required (often 0 is fine)
  onClose: () => void;
  showRegisterActions?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function timeRangeFromEvent(startIso: string, endIso?: string) {
  const start = new Date(startIso);
  if (endIso) {
    const end = new Date(endIso);
    return `${formatTime(start)} - ${formatTime(end)}`;
  }
  return formatTime(start);
}

function attendeeLabel(count?: number, capacity?: number) {
  if (capacity) {
    return `${count || 0} / ${capacity} attendees`;
  }
  return `${count || 0} attendees`;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  events,
  onClose,
  showRegisterActions = true,
}) => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="w-full h-64 sm:h-80 bg-brand-pale/20 relative shrink-0">
          <CoverImage
            stored={event.image}
            slotIndex={events ? events.findIndex((e) => e.id === event.id) : 0}
            variant="event"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-dark leading-tight flex-1">
              {event.title}
            </h2>
            {event.category && (
              <span className="inline-block px-3 py-1 bg-brand-pale text-brand-dark text-sm font-bold rounded-full h-fit whitespace-nowrap capitalize">
                {event.category}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 text-sm text-gray-700 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-brand-medium" />
              <span className="font-medium">{formatDateOnly(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-brand-medium" />
              <span className="font-medium">{timeRangeFromEvent(event.date, event.end_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-brand-medium" />
                <span className="font-medium break-words">{event.location.trim()}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={18} className="text-brand-medium" />
              <span className="font-medium">{attendeeLabel(event._count?.attendees, event.capacity)}</span>
            </div>
            
            {event.virtualLink && (
              <div className="flex items-center gap-2 w-full mt-2 border-t border-gray-200/50 pt-3">
                <LinkIcon size={18} className="text-brand-medium shrink-0" />
                <a 
                  href={event.virtualLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-brand-medium hover:underline break-all"
                >
                  {event.virtualLink}
                </a>
              </div>
            )}
            {event.contactEmail && (
              <div className="flex items-center gap-2 w-full">
                <Mail size={18} className="text-brand-medium shrink-0" />
                <a 
                  href={`mailto:${event.contactEmail}`}
                  className="font-medium text-gray-700 hover:text-brand-medium transition-colors break-all"
                >
                  {event.contactEmail}
                </a>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">About this Event</h3>
            <div className="text-gray-600 prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
              {event.description ? event.description : <span className="italic text-gray-400">No additional details provided.</span>}
            </div>
          </div>

          {showRegisterActions && (
            <button
              type="button"
              onClick={() => {
                if (event.organizationId) {
                  navigate(`/register?org=${event.organizationId}`);
                } else {
                  navigate(`/register`);
                }
              }}
              className="w-full py-4 rounded-xl bg-brand-medium text-white font-bold text-base hover:bg-brand-light transition-all shadow-md shadow-brand-medium/25 hover:shadow-lg focus:outline-none"
            >
              Register for this Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
