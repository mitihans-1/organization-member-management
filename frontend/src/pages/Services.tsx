import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Service } from '../types';
import {
  Tag,
  CreditCard,
  Clock,
  Users,
  CheckCircle2,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import { useAuth } from '../context/AuthContext';

const HOST_CHECKLIST = [
  'Easy service creation and management',
  'Automated request tracking',
  'Real-time approval workflow',
  'Integrated member communication',
  'Service analytics and reporting',
];

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['public-services'],
    queryFn: () => api.get('/services').then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-[#f7f8f6] font-poppins text-gray-800">
      <GuestNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark tracking-tight mb-4">
            Available Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Explore services offered by our partner organizations
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
            {services?.map((service, index) => (
              <article
                key={service.id}
                className="bg-white rounded-2xl shadow-md shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                <div 
                  className="relative h-52 sm:h-56 bg-brand-pale/20 shrink-0 cursor-pointer overflow-hidden group"
                  onClick={() => user ? setSelectedService(service) : (service.organizationId ? navigate(`/register?org=${service.organizationId}`) : navigate('/register'))}
                >
                  <CoverImage
                    stored={service.image}
                    slotIndex={index}
                    variant="event"
                    alt=""
                    className="w-full h-full object-cover min-h-[13rem] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h2 
                    className="text-xl font-bold text-brand-dark leading-snug mb-4 cursor-pointer hover:text-brand-medium transition-colors"
                    onClick={() => user ? setSelectedService(service) : (service.organizationId ? navigate(`/register?org=${service.organizationId}`) : navigate('/register'))}
                    title="Service details"
                  >
                    {service.title}
                  </h2>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <Tag
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight capitalize">
                        {service.category}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <CreditCard
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">
                        {service.payment_required 
                          ? service.price 
                            ? `$${service.price}`
                            : 'Paid' 
                          : 'Free'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Clock
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">
                        {service.status}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Users
                        size={17}
                        className="text-brand-medium shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">
                        {(service as any).subscribers?.length || 0} Subscribers
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                    {service.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setSelectedService(service);
                      } else {
                        if (service.organizationId) {
                          navigate(`/register?org=${service.organizationId}`);
                        } else {
                          navigate(`/register`);
                        }
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-brand-medium text-white font-bold text-sm hover:bg-brand-light transition-colors shadow-md shadow-brand-medium/25"
                  >
                    {user ? 'View Details' : 'Learn More'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && services?.length === 0 && (
          <p className="text-center text-gray-500 py-16 max-w-lg mx-auto leading-relaxed">
            No services are listed yet. Organization admins can add services from the dashboard—they will show here automatically.
          </p>
        )}
      </div>

      <section className="bg-gray-100 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4 tracking-tight">
                Want to Offer Your Own Services?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px] sm:text-base">
                Partner with us to reach your members and run professional service operations from request to completion—all in one place.
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

      {/* Full Service Information Modal */}
      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          services={services}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default Services;
