import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Users,
  Globe,
  ShieldCheck,
  Zap,
  BarChart3,
  Calendar,
  CreditCard,
  MessageSquare,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  HeartHandshake,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { AboutContent } from '../../types/content';

interface AboutPageViewProps {
  content: AboutContent;
  organizationName?: string;
  showCta?: boolean;
}

const platformStats = [
  { label: 'Organizations', value: '5,000+', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Active Members', value: '120K+', icon: Users, color: 'text-sky-500', bg: 'bg-sky-50' },
  { label: 'Events Managed', value: '48K+', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Platform Uptime', value: '99.9%', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const features = [
  {
    icon: Users,
    title: 'Member Management',
    desc: 'Onboard, track, and engage your members with powerful CRM-style tools. Approve applications, manage roles, issue digital ID cards, and keep member data secure.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: Calendar,
    title: 'Event Coordination',
    desc: 'Plan in-person, virtual, and hybrid events. Manage registrations, track attendance, send notifications, and generate detailed post-event reports automatically.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    icon: Zap,
    title: 'Service Catalogue',
    desc: 'Offer a curated catalogue of services to your members. Define SLAs, manage delivery, track requests, and measure satisfaction — all in one place.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: CreditCard,
    title: 'Payments & Subscriptions',
    desc: 'Collect membership dues, process service payments, and handle renewals. Built-in billing cycles, receipts, and a clear audit trail for your finance team.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Make data-driven decisions with dashboards covering member growth, event attendance, revenue trends, and service utilization — exportable in one click.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    desc: 'Send announcements, publish blog posts, and chat with members in real time. Keep your community informed, engaged, and connected all year round.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
];

const steps = [
  {
    number: '01',
    title: 'Register your organization',
    desc: 'Sign up in minutes. Add your organization details, set your branding, and configure your membership tiers and subscription plans.',
    icon: Building2,
  },
  {
    number: '02',
    title: 'Invite your team & members',
    desc: 'Add org admins and open member registration. Approve applicants, assign roles, and issue digital ID cards instantly.',
    icon: Users,
  },
  {
    number: '03',
    title: 'Run events & services',
    desc: 'Create events, list services, and publish blog posts from your dashboard. Members browse, register, and pay — all without leaving OMMS.',
    icon: Zap,
  },
  {
    number: '04',
    title: 'Grow with insights',
    desc: 'Use real-time reports to understand engagement, optimize operations, and present clean financials to your board every quarter.',
    icon: TrendingUp,
  },
];

const values = [
  { icon: HeartHandshake, title: 'Community First', desc: 'Every feature is designed around the real needs of member-based organizations — not generic enterprise software.' },
  { icon: Lock, title: 'Privacy & Security', desc: 'Role-based access, data isolation between organizations, and secure defaults baked into every layer of the platform.' },
  { icon: Award, title: 'Reliability', desc: '99.9% uptime SLA, automatic backups, and a platform teams can depend on for their most critical workflows.' },
  { icon: Globe, title: 'Built to Scale', desc: 'From 10 members to 10,000, OMMS grows with you — no migrations, no re-configurations, no surprises.' },
];

const AboutPageView: React.FC<AboutPageViewProps> = ({
  content,
  organizationName,
  showCta = true,
}) => {
  const isOrgView = !!organizationName;
  const displayStats =
    content.stats?.length > 0
      ? content.stats.map((s, i) => ({
          label: s.label,
          value: s.value,
          icon: platformStats[i % platformStats.length].icon,
          color: platformStats[i % platformStats.length].color,
          bg: platformStats[i % platformStats.length].bg,
        }))
      : platformStats;

  return (
    <>
      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 70%, #164e63 100%)',
        }}
        className="relative overflow-hidden pt-28 pb-36 text-white"
      >
        {/* decorative blobs */}
        <div
          style={{ background: 'rgba(99,102,241,0.18)', filter: 'blur(80px)' }}
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
        />
        <div
          style={{ background: 'rgba(14,165,233,0.15)', filter: 'blur(80px)' }}
          className="absolute bottom-0 -left-16 w-80 h-80 rounded-full pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {organizationName && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/20 backdrop-blur-sm text-sky-200">
              <Building2 size={13} />
              {organizationName}
            </span>
          )}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
            {content.title || (isOrgView ? 'About Us' : 'The Platform Built for\nMember Organizations')}
          </h1>
          {content.subtitle ? (
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {content.subtitle}
            </p>
          ) : !isOrgView ? (
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              OMMS brings together member management, events, services, payments, and reporting
              into one elegant system — so your team can focus on people, not paperwork.
            </p>
          ) : null}

          {!isOrgView && (
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}
              >
                Get started free <ArrowRight size={16} />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Explore services
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
            {displayStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                    <Icon size={22} className={stat.color} />
                  </div>
                  <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mission / Story ── */}
      {(content.mission || content.story) && (
        <section className="py-28 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                {content.mission && (
                  <>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                      <Target size={13} /> Our Mission
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight">
                      {content.mission}
                    </h2>
                  </>
                )}
                {content.story && (
                  <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-indigo-300 pl-5 whitespace-pre-wrap">
                    {content.story}
                  </p>
                )}
              </div>

              {/* Visual card stack */}
              <div className="grid grid-cols-2 gap-4">
                {['Member Growth', 'Event Reach', 'Revenue Clarity', 'Team Alignment'].map((label, i) => {
                  const colors = [
                    { border: 'border-indigo-200', icon: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-500' },
                    { border: 'border-sky-200', icon: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' },
                    { border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' },
                    { border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', bar: 'bg-violet-500' },
                  ];
                  const c = colors[i];
                  const widths = ['w-4/5', 'w-3/4', 'w-5/6', 'w-2/3'];
                  return (
                    <div key={label} className={`p-6 rounded-2xl bg-white border ${c.border} shadow-sm flex flex-col gap-4`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${c.bar} ${widths[i]}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Platform Features (shown for platform / guest view) ── */}
      {!isOrgView && (
        <section className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                Everything you need
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                One platform, every dimension<br />of membership
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Purpose-built features for organizations of all sizes — associations, clubs, NGOs, professional bodies, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`group p-8 rounded-3xl bg-white border ${f.border} shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${f.bg} mb-5`}>
                      <Icon size={22} className={f.color} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Timeline (if provided) ── */}
      {content.timeline && content.timeline.length > 0 && (
        <section className="py-28 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-full mb-4">
                Our journey
              </span>
              <h2 className="text-4xl font-black text-slate-900">Milestones that shaped us</h2>
            </div>
            <div className="relative space-y-0">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-indigo-100 hidden md:block" />
              {content.timeline.map((item, idx) => (
                <div key={`${item.year}-${item.title}`} className="relative flex gap-8 items-start pb-10">
                  <div className="hidden md:flex flex-col items-center z-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200">
                      {item.year}
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <span className="md:hidden inline-block text-xs font-black text-indigo-600 mb-2">{item.year}</span>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works (platform view) ── */}
      {!isOrgView && (
        <section className="py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                How it works
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                Up and running in four steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative flex flex-col gap-5">
                    {/* connector line */}
                    {idx < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent -translate-x-4 z-0" />
                    )}
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shrink-0">
                        {step.number}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Icon size={18} className="text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Values ── */}
      {!isOrgView && (
        <section
          className="py-28 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)' }}
        >
          <div
            style={{ background: 'rgba(139,92,246,0.2)', filter: 'blur(80px)' }}
            className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-300 bg-violet-900/40 border border-violet-700/50 px-3 py-1.5 rounded-full">
                Our principles
              </span>
              <h2 className="text-4xl md:text-5xl font-black">
                What we stand for
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Icon size={22} className="text-violet-300" />
                    </div>
                    <h3 className="text-lg font-black">{v.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      {showCta && (
        <section className="py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
              Get started today
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              Ready to transform how<br />you manage your community?
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Join thousands of organizations that use OMMS to save time, strengthen member relationships, and grow with confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}
              >
                Start for free <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-slate-700 border-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200"
              >
                Talk to sales
              </Link>
            </div>
            <p className="text-xs text-slate-400">No credit card required · Free plan available · Setup in under 5 minutes</p>
          </div>
        </section>
      )}
    </>
  );
};

export default AboutPageView;
