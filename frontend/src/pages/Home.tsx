import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Shield,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Quote,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import LiveChatWidget from '../components/LiveChatWidget';
import useCountAnimation from '../hooks/useCountAnimation';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCardPagination } from '../hooks/useCardPagination';
import CardPagination from '../components/filters/CardPagination';

const forest = '#3d5a2b';
const forestHover = '#4f772d';

// Map from feature IDs to user-friendly labels
const FEATURE_LABELS: Record<string, string> = {
  'overview': 'Dashboard Overview',
  'members': 'Member Management',
  'events': 'Events',
  'services': 'Services',
  'news': 'News',
  'contact': 'Contact',
  'subscriptions': 'Member Subscriptions',
  'payments': 'Payments',
  'tickets': 'Tickets',
  'chat': 'Chat',
  'reports': 'Reports',
  'id-cards': 'ID Cards',
  'licenses': 'Licenses',
  'profile': 'Profile'
};

const StatCard: React.FC<{ stat: { value: string; label: string } }> = ({ stat }) => {
  const animatedValue = useCountAnimation(stat.value);
  return (
    <div>
      <p className="text-3xl md:text-4xl font-black tracking-tight">
        {animatedValue}
      </p>
      <p className="mt-2 text-sm md:text-base font-semibold text-white/90 uppercase tracking-wide">
        {stat.label}
      </p>
    </div>
  );
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState([
    { value: '150+', label: 'Organizations' },
    { value: '3,000+', label: 'Active Members' },
    { value: '750+', label: 'Million Processed' },
    { value: '99%', label: 'Satisfaction' },
  ]);
  const [endorsements, setEndorsements] = useState<
    { id: string; organizationName: string; message: string; createdAt: string }[]
  >([]);
  const [plans, setPlans] = useState<any[]>([]);

  const slides = [
    {
      image: '/asset/c_magnifying_glass_with_illustrative_people_dark.jpg',
      title: 'Organization Member Management, Simplified',
      subtitle:
        'OMMS brings members, events, and payments together in one secure platform built for modern organizations.',
    },
    {
      image: '/asset/membership-management-system.webp',
      title: 'Streamline Your Membership Operations',
      subtitle: 'Powerful tools to manage members, events, and payments—all in one place.',
    },
    {
      image: '/asset/eventmanagementpowerpointpresentationslides-210810034621-thumbnail.webp',
      title: 'Events & Engagement That Scale',
      subtitle: 'Plan, promote, and track attendance with confidence.',
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/public/stats`);
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const e = await api.get('/public/endorsements');
        setEndorsements(e.data || []);
      } catch {
        setEndorsements([]);
      }

      try {
        // Always load super-admin-level plans (not org-level plans)
        const p = await api.get('/plans');
        console.log("Fetched plans:", p.data);
        setPlans(p.data || []);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setPlans([]);
      }
    };
    load();
  }, []);

  const features = [
    {
      title: 'Member Management',
      desc: 'Profiles, groups, and communication in one intuitive workspace.',
      icon: Users,
    },
    {
      title: 'Event Coordination',
      desc: 'Plan, promote, and track attendance for every organization event.',
      icon: Calendar,
    },
    {
      title: 'Payment Processing',
      desc: 'Secure collection with support for multiple methods and recurring billing.',
      icon: CreditCard,
    },
    {
      title: 'Advanced Analytics',
      desc: 'Insights into membership trends, revenue, and engagement over time.',
      icon: BarChart3,
    },
    {
      title: 'Role-Based Access',
      desc: 'Super admin, org admin, and member views with least-privilege defaults.',
      icon: Shield,
    },
    {
      title: 'Custom Workflows',
      desc: 'Adapt approvals, reminders, and onboarding to how your org actually works.',
      icon: GitBranch,
    },
  ];

  const steps = [
    { n: 1, label: 'Sign Up' },
    { n: 2, label: 'Import Members' },
    { n: 3, label: 'Configure Settings' },
    { n: 4, label: 'Go Live' },
  ];

  const pricingCards = useMemo(() => {
    const list = Array.isArray(plans) ? plans : [];
    console.log("useMemo: plans list", list);

    const normalize = (p: any) => {
      const name = p.name || 'Plan';
      const price = Number(p.price ?? 0);
      const billing = p.billing_cycle || p.billingCycle || 'monthly';
      const durationDays = p.duration_days || p.durationDays;
      const maxMembers = p.max_members || p.maxMembers;

      // Map allowed_features to user-friendly labels, or fallback to existing features
      const features = Array.isArray(p.allowed_features)
        ? p.allowed_features.map((id: string) => FEATURE_LABELS[id] || id)
        : Array.isArray(p.features)
          ? p.features
          : typeof p.features === 'string'
            ? p.features
                .split(',')
                .map((x: string) => x.trim())
                .filter(Boolean)
            : [];

      const sub =
        p.description ||
        (maxMembers
          ? `Up to ${maxMembers} members`
          : durationDays
            ? `${durationDays} days`
            : '');

      const href = user ? '/dashboard' : '/register';
      const cta = user ? 'Go to Dashboard' : 'Get Started';

      return {
        id: p.id || name,
        name,
        price,
        billing,
        sub,
        highlight: false,
        features,
        href,
        cta,
      };
    };

    const cards = list.map(normalize);
    if (cards.length > 0) {
      const mid = Math.floor(cards.length / 2);
      cards[mid] = { ...cards[mid], highlight: true };
    }
    console.log("useMemo: normalized pricing cards", cards);
    return cards;
  }, [plans, user]);

  const pricingResetKey = `${user?.role || 'guest'}|${pricingCards.length}`;
  const {
    pagedItems: pagedPricingCards,
    currentPage: pricingPage,
    totalPages: pricingTotalPages,
    setPage: setPricingPage,
    totalItems: pricingTotalItems,
    pageSize: pricingPageSize,
  } = useCardPagination(pricingCards, 3, pricingResetKey);
  
  console.log("Home.tsx: pricingCards.length", pricingCards.length);
  console.log("Home.tsx: pagedPricingCards", pagedPricingCards);

  const endorsementResetKey = String(endorsements.length);
  const {
    pagedItems: pagedEndorsements,
    currentPage: endorsementPage,
    totalPages: endorsementTotalPages,
    setPage: setEndorsementPage,
    totalItems: endorsementTotalItems,
    pageSize: endorsementPageSize,
  } = useCardPagination(endorsements, 3, endorsementResetKey);

  return (
    <div className="min-h-screen bg-white font-poppins text-gray-800">
      <GuestNavbar />

      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ '--bg-image': `url(${slide.image})` } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-hero bg-cover bg-center bg-no-repeat" />
            <div className="relative h-full min-h-[78vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center text-white py-24">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 md:mb-6 max-w-4xl leading-tight drop-shadow-md">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-10 max-w-2xl text-white/95 font-medium drop-shadow">
                {slide.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <Link
                  to="/register"
                  className="rounded-full px-10 py-3.5 text-lg font-bold text-white shadow-lg transition-all hover:opacity-95"
                  style={{ backgroundColor: forest }}
                >
                  Get started
                </Link>
                <Link
                  to="/about"
                  className="rounded-full border-2 border-white px-10 py-3.5 text-lg font-bold text-white hover:bg-white hover:text-[#1a2e0a] transition-colors"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              title={`Slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                index === currentSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats — full-width forest green bar */}
      <section className="py-12 md:py-14" style={{ backgroundColor: forest }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 lg:gap-4 text-center text-white">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-gray-50 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e0a]">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run membership, events, and finances—without the spreadsheet chaos.
            </p>
            <div className="mt-4 h-1 w-16 rounded-full mx-auto" style={{ backgroundColor: forest }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${forest}18`, color: forest }}
                  >
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a2e0a] mb-3">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple Implementation */}
      <section className="py-20 md:py-24 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1a2e0a] mb-14">
            Simple Implementation
          </h2>
          <div className="relative">
            <div
              className="absolute left-[12%] right-[12%] top-7 h-0.5 hidden md:block rounded-full"
              style={{ backgroundColor: `${forest}55` }}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white shadow-md mb-4"
                    style={{ backgroundColor: forest }}
                  >
                    {s.n}
                  </div>
                  <p className="font-bold text-[#1a2e0a]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-24 bg-gray-50 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e0a]">Flexible Pricing</h2>
            <p className="mt-3 text-gray-600">All prices in ETB (Ethiopian Birr)</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {pagedPricingCards.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-white border p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-[#3d5a2b] shadow-xl scale-[1.02] z-10 ring-2 ring-[#3d5a2b]/20'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-4 py-1 rounded-full"
                    style={{ backgroundColor: forest }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#1a2e0a]">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{plan.sub}</p>
                <p className="mt-6 text-4xl font-black text-[#1a2e0a]">
                  {Number(plan.price || 0).toFixed(0)}{' '}
                  <span className="text-lg font-semibold text-gray-500">ETB/month</span>
                </p>
                <ul className="mt-8 space-y-3 flex-1 text-sm text-gray-600">
                  {(plan.features || []).map((line: string) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-[#3d5a2b] font-bold">✓</span>
                      {line}
                    </li>
                  ))}
                </ul>
                {plan.highlight ? (
                  <Link
                    to={plan.href}
                    className="mt-10 block text-center rounded-full py-3.5 font-bold text-white shadow-md hover:opacity-95 transition-opacity"
                    style={{ backgroundColor: forest }}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    to={plan.href}
                    className={`mt-10 block text-center font-bold ${
                      plan.cta === 'Contact Sales'
                        ? 'text-[#3d5a2b] hover:underline py-3.5'
                        : 'rounded-full border-2 border-[#3d5a2b] text-[#3d5a2b] py-3.5 hover:bg-[#3d5a2b]/5'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <CardPagination
            currentPage={pricingPage}
            totalPages={pricingTotalPages}
            totalItems={pricingTotalItems}
            pageSize={pricingPageSize}
            onPageChange={setPricingPage}
            itemLabel="plans"
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1a2e0a] mb-12">
            Trusted by Organizations
          </h2>
          {endorsements.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-10 text-center text-gray-600">
              No organization endorsements yet.
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {pagedEndorsements.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-7 relative">
                    <Quote className="absolute top-5 left-5 text-[#3d5a2b]/20 w-10 h-10" strokeWidth={1} />
                    <p className="text-gray-700 font-medium leading-relaxed mt-6 whitespace-pre-wrap">“{t.message}”</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: forest }}>
                        {t.organizationName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1a2e0a] truncate">{t.organizationName}</p>
                        <p className="text-[11px] text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <CardPagination
                currentPage={endorsementPage}
                totalPages={endorsementTotalPages}
                totalItems={endorsementTotalItems}
                pageSize={endorsementPageSize}
                onPageChange={setEndorsementPage}
                itemLabel="endorsements"
              />
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20" style={{ backgroundColor: forest }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold leading-snug">
            Ready to Transform Your Membership Management?
          </h2>
          <Link
            to="/register"
            className="inline-block mt-8 rounded-full bg-white px-10 py-3.5 text-lg font-bold shadow-lg transition-colors hover:bg-gray-100"
            style={{ color: forest }}
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <GuestFooter />
      <LiveChatWidget />
    </div>
  );
};

export default Home;
