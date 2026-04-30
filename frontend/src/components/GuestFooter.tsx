import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const GuestFooter: React.FC = () => {
  const { data: config } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => api.get('/admin/system-config').then((r) => r.data),
  });

  return (
    <footer className="bg-[#0d1f0d] text-white pt-16 pb-10 font-poppins border-t border-[#1a331a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-5">
              <img src="/asset/image.png" alt="" className="h-10 w-auto brightness-0 invert opacity-90" />
              <span className="text-2xl font-black tracking-tight text-white">{config?.platformName || 'OMMS'}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Organization Member Management System — modern tools for members, events, and payments in
              one place.
            </p>
            <div className="flex gap-3">
              {config?.facebookUrl && (
                <a
                  href={config.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3d5a2b] transition-colors"
                >
                  <Facebook size={18} />
                </a>
              )}
              {config?.telegramUrl && (
                <a
                  href={config.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Telegram"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3d5a2b] transition-colors"
                >
                  <Send size={18} />
                </a>
              )}
              {config?.linkedinUrl && (
                <a
                  href={config.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3d5a2b] transition-colors"
                >
                  <Linkedin size={18} />
                </a>
              )}
              <a
                href="#"
                title="Twitter"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3d5a2b] transition-colors"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-bold mb-6 text-white/90 uppercase tracking-wider">Company</h5>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  Staff
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold mb-6 text-white/90 uppercase tracking-wider">Services</h5>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Member Management
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Event Management
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Payment Processing
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Reporting &amp; Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold mb-6 text-white/90 uppercase tracking-wider">Contact Us</h5>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin size={20} className="text-[#90a955] shrink-0 mt-0.5" />
                <span>{config?.contactAddress || 'Addis Ababa, Ethiopia'}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail size={20} className="text-[#90a955] shrink-0" />
                <a href={`mailto:${config?.contactEmail || 'info@omms.com'}`} className="hover:text-white transition-colors">
                  {config?.contactEmail || 'info@omms.com'}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone size={20} className="text-[#90a955] shrink-0" />
                <a href={`tel:${config?.contactPhone || '+251911234567'}`} className="hover:text-white transition-colors">
                  {config?.contactPhone || '+251 911 234 567'}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Clock size={20} className="text-[#90a955] shrink-0" />
                <span>{config?.contactHours || 'Mon - Fri: 8:00 AM - 5:00 PM'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {config?.platformName || 'OMMS'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default GuestFooter;
