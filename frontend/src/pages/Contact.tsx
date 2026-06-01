import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import ContactPageView from '../components/content/ContactPageView';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PlatformContentResponse } from '../types/content';

const Contact: React.FC = () => {
  const { user } = useAuth();

  const platformQuery = useQuery<PlatformContentResponse>({
    queryKey: ['platform-content'],
    queryFn: () => api.get('/public/platform-content').then((r) => r.data),
  });

  const submitContact = async (form: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    return api.post('/public/contact', form);
  };

  const isLoading = platformQuery.isLoading;
  const isError = platformQuery.isError;

  const defaultName = user?.name || '';
  const defaultEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-white font-poppins">
      <GuestNavbar />
      {isLoading ? (
        <div className="py-32 text-center text-gray-500">Loading...</div>
      ) : isError ? (
        <div className="py-32 text-center text-gray-500">
          Unable to load contact information.
        </div>
      ) : platformQuery.data ? (
        <ContactPageView
          contact={platformQuery.data.contact}
          onSubmit={submitContact}
          heading="Get in Touch"
          subheading={`Reach the ${platformQuery.data.platformName} team — we are here to help.`}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      ) : (
        <div className="py-32 text-center text-gray-500">No content available.</div>
      )}
      <GuestFooter />
    </div>
  );
};

export default Contact;
