import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Event } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';

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

/** Single `date` field: show a plausible time range from start + few hours */
function timeRangeFromEvent(iso: string, id: number) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + (2 + (id % 5)) * 3600000);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function attendeeLabel(id: number) {
  const n = 80 + (id * 47) % 420;
  return `${n} attendees`;
}

const HOST_CHECKLIST = [
  'Easy online registration and ticketing',
  'Automated reminders and follow-ups',
  'Real-time attendance tracking',
  'Integrated member communication',
  'Post-event analytics and reporting',
];

const PublicEvents: React.FC = () => {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['public-events'],
    queryFn: () => api.get('/events').then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-[#f7f8f6] font-poppins text-gray-800">
      <GuestNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark tracking-tight mb-4">
            Upcoming Events
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Join our community for these exclusive events
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md border border-gray-100/80 h-[520px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events?.map((event, index) => (
              <article
                key={event.id}
                className="bg-white rounded-2xl shadow-md shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-52 sm:h-56 bg-brand-pale/20 shrink-0">
                  <CoverImage
                    stored={event.image}
                    slotIndex={index}
                    variant="event"
                    alt=""
                    className="w-full h-full object-cover min-h-[13rem]"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-brand-dark leading-snug mb-4">
                    {event.title}
                  </h2>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <Calendar
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">
                        {formatDateOnly(event.date)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Clock
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight tabular-nums">
                        {timeRangeFromEvent(event.date, event.id)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight break-words">
                        {event.location?.trim() || 'TBA'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Users
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">
                        {attendeeLabel(event.id)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-6 flex-1">
                    {event.description}
                  </p>

                  <button
                    type="button"
                    className="w-full py-3 rounded-xl bg-brand-medium text-white font-bold text-sm hover:bg-brand-light transition-colors shadow-md shadow-brand-medium/25"
                  >
                    Register Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && events?.length === 0 && (
          <p className="text-center text-gray-500 py-16 max-w-lg mx-auto leading-relaxed">
            No upcoming events are listed yet. Admins can add events from the dashboard—they will show here automatically.
          </p>
        )}
      </div>

      <section className="bg-gray-100 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4 tracking-tight">
                Want to Host Your Own Event?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px] sm:text-base">
                Partner with us to reach your members and run polished events from promotion to follow-up—all in one place.
              </p>
              <ul className="space-y-4 mb-10">
                {HOST_CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-medium/15 text-brand-medium">
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </span>
                    <span className="text-gray-700 text-[15px] leading-snug pt-0.5">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
              >
                Learn More
              </Link>
            </div>
            <div className="order-first lg:order-none">
              <img
                src="/asset/images-for-blogs.jpeg"
                alt=""
                className="w-full h-[280px] sm:h-[340px] lg:h-[380px] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <GuestFooter />
    </div>
  );
};

export default PublicEvents;
