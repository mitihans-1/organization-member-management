import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultPathForRole } from '../lib/roleRoutes';
import { LayoutDashboard, Menu, X } from 'lucide-react';

const navLinkClass =
  'text-gray-800 hover:text-[#3d5a2b] font-semibold text-sm transition-colors whitespace-nowrap';

const GuestNavbar: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link to="/" className={navLinkClass} onClick={() => setOpen(false)}>
        Home
      </Link>
      <Link to="/about" className={navLinkClass} onClick={() => setOpen(false)}>
        About
      </Link>
      <Link to="/#features" className={navLinkClass} onClick={() => setOpen(false)}>
        Features
      </Link>
      <Link to="/#pricing" className={navLinkClass} onClick={() => setOpen(false)}>
        Pricing
      </Link>
      <Link to="/blogs" className={navLinkClass} onClick={() => setOpen(false)}>
        Blog
      </Link>
      <Link to="/contact" className={navLinkClass} onClick={() => setOpen(false)}>
        Contact
      </Link>
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 font-poppins border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/asset/image.png" alt="" className="h-11 w-auto" />
            <span className="text-xl sm:text-2xl font-black text-[#1a2e0a] tracking-tight">
              OMMS
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10">{links}</div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={defaultPathForRole(user.role)}
                className="inline-flex items-center gap-2 rounded-full bg-[#3d5a2b] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#4f772d] transition-colors"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex rounded-full border-2 border-[#3d5a2b] px-5 py-2 text-sm font-bold text-[#3d5a2b] hover:bg-[#3d5a2b]/5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex rounded-full bg-[#3d5a2b] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#4f772d] transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}

            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-gray-100 py-4 flex flex-col gap-3 pb-6">
            {links}
            {!user && (
              <Link
                to="/login"
                className="sm:hidden inline-flex justify-center rounded-full border-2 border-[#3d5a2b] px-5 py-2.5 text-sm font-bold text-[#3d5a2b]"
                onClick={() => setOpen(false)}
              >
                Log In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default GuestNavbar;
