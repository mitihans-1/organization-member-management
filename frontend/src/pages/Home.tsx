import React, { useState, useEffect } from 'react';
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

const forest = '#3d5a2b';
const forestHover = '#4f772d';

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

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
    const t = setInterval(() => setTestimonialIdx((p) => (p + 1) % testimonials.length), 8000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { value: '150+', label: 'Organizations' },
    { value: '3,000+', label: 'Active Members' },
    { value: '750+', label: 'Million Processed' },
    { value: '99%', label: 'Satisfaction' },
  ];

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

  const pricing = [
    {
      name: 'Starter',
      price: '0',
      sub: 'Perfect to explore OMMS',
      highlight: false,
      cta: 'Get Started',
      href: '/register',
      features: ['Up to 5 members', 'Core member directory', 'Email support'],
    },
    {
      name: 'Professional',
      price: '25',
      sub: 'For growing organizations',
      highlight: true,
      cta: 'Choose Plan',
      href: '/register',
      features: ['Up to 500 members', 'Events & blogs', 'Priority support', 'Payment tracking'],
    },
    {
      name: 'Enterprise',
      price: '99',
      sub: 'Maximum scale & control',
      highlight: false,
      cta: 'Contact Sales',
      href: '/contact',
      features: ['Up to 5,000+ members', 'Dedicated success manager', 'Custom integrations', 'SLA options'],
    },
  ];

  const testimonials = [
    {
      quote:
        'OMMS cut our admin workload in half. Member records and payments finally live in one place.',
      name: 'Muaz Amin',
      role: 'President',
    },
    {
      quote: 'Events and RSVPs used to be spreadsheets. Now our board actually trusts the numbers.',
      name: 'Elisa Amin',
      role: 'Treasurer',
    },
    {
      quote: 'We rolled out to five chapters in a month. The role-based dashboards made training easy.',
      name: 'Obsa Amin',
      role: 'Operations Lead',
    },
  ];

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
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-black tracking-tight">{s.value}</p>
                <p className="mt-2 text-sm md:text-base font-semibold text-white/90 uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
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
            {pricing.map((plan) => (
              <div
                key={plan.name}
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
                  {plan.price}{' '}
                  <span className="text-lg font-semibold text-gray-500">ETB/month</span>
                </p>
                <ul className="mt-8 space-y-3 flex-1 text-sm text-gray-600">
                  {plan.features.map((line) => (
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
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1a2e0a] mb-12">
            Trusted by Organizations
          </h2>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-8 md:p-12 min-h-[220px] flex items-center">
              <Quote
                className="absolute top-6 left-6 text-[#3d5a2b]/20 w-12 h-12 md:w-16 md:h-16"
                strokeWidth={1}
              />
              <div className="w-full text-center px-4">
                <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed max-w-2xl mx-auto">
                  “{testimonials[testimonialIdx].quote}”
                </p>
                <div className="mt-8 flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: forest }}
                  >
                    {testimonials[testimonialIdx].name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <p className="font-bold text-[#1a2e0a] mt-2">{testimonials[testimonialIdx].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[testimonialIdx].role}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                aria-label="Previous testimonial"
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50"
                onClick={() =>
                  setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)
                }
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === testimonialIdx ? 'bg-[#3d5a2b]' : 'bg-gray-300'
                    }`}
                    onClick={() => setTestimonialIdx(i)}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next testimonial"
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50"
                onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default Home;
