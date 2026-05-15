import React from 'react';
import { Link } from 'react-router-dom';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import { Settings, UserPlus, Database, Lock, Terminal, BarChart, Rocket, Globe } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    { title: 'Community Tools', desc: 'Powerful tools for member interaction and engagement.', icon: <UserPlus size={28} /> },
    { title: 'Secure Database', desc: 'Industry-standard encryption and security protocols.', icon: <Database size={28} /> },
    { title: 'Admin Controls', desc: 'Granular control over member roles and permissions.', icon: <Settings size={28} /> },
    { title: 'Global Access', desc: 'Cloud-based infrastructure for worldwide availability.', icon: <Globe size={28} /> },
    { title: 'Real-time Analytics', desc: 'Deep insights into your organization’s health and growth.', icon: <BarChart size={28} /> },
    { title: 'Smart Integration', desc: 'Easily connect with your existing workflows and APIs.', icon: <Terminal size={28} /> },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins">
      <GuestNavbar />

      <section className="relative pt-24 pb-32 bg-brand-pale/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
           <h1 className="text-5xl md:text-6xl font-black text-brand-dark leading-tight tracking-tight">
             Comprehensive <span className="text-brand-medium">Services</span> for Your Organization
           </h1>
           <p className="text-xl text-brand-deep max-w-3xl mx-auto leading-relaxed font-medium">
             We provide a complete ecosystem to help you manage every aspect of your membership-driven organization with ease and efficiency.
           </p>
        </div>
      </section>

      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {services.map((service, idx) => (
              <div key={idx} className="p-12 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2">
                 <div className="w-16 h-16 rounded-2xl bg-brand-pale/30 flex items-center justify-center mb-10 group-hover:bg-brand-medium group-hover:text-white transition-all duration-300 text-brand-medium shadow-sm">
                    {service.icon}
                 </div>
                 <h3 className="text-2xl font-bold text-brand-dark mb-4">{service.title}</h3>
                 <p className="text-gray-600 leading-relaxed text-lg font-medium">{service.desc}</p>
                 <button className="mt-10 text-brand-medium font-black flex items-center space-x-2 group-hover:translate-x-2 transition-transform uppercase tracking-widest text-sm">
                    <span>Learn More</span>
                    <Rocket size={18} />
                 </button>
              </div>
            ))}
         </div>
      </section>

      <section className="py-24 bg-brand-dark text-white text-center space-y-10 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-light to-transparent"></div>
         <h2 className="text-5xl font-black tracking-tight relative z-10">Experience the Future of Management</h2>
         <p className="text-brand-pale/70 text-xl max-w-2xl mx-auto leading-relaxed relative z-10 font-medium">Don’t let administrative tasks hold you back. Let MemberShip Pro handle the heavy lifting while you focus on what truly matters.</p>
         <div className="relative z-10 pt-6">
            <Link 
               to="/register"
               className="bg-brand-medium text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-brand-light transition-all shadow-2xl hover:shadow-brand-medium/30"
            >
               Start Your Free Trial
            </Link>
         </div>
      </section>

      <GuestFooter />
    </div>
  );
};

export default Services;
