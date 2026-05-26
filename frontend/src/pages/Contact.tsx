import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import ContactPageView from '../components/content/ContactPageView';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  OrganizationContentResponse,
  PlatformContentResponse,
} from '../types/content';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const isMember = user?.role === 'member';
  const isOrgAdmin = user?.role === 'orgAdmin';

  const platformQuery = useQuery<PlatformContentResponse>({
    queryKey: ['platform-content'],
    queryFn: () => api.get('/public/platform-content').then((r) => r.data),
    enabled: !isMember,
  });

  const orgQuery = useQuery<OrganizationContentResponse>({
    queryKey: ['organization-content'],
    queryFn: () => api.get('/public/organization-content').then((r) => r.data),
    enabled: isMember,
  });

  const submitContact = async (form: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    return api.post('/public/contact', form);
  };

  const isLoading = isMember ? orgQuery.isLoading : platformQuery.isLoading;
  const isError = isMember ? orgQuery.isError : platformQuery.isError;

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
      ) : isMember && orgQuery.data ? (
        <ContactPageView
          contact={orgQuery.data.contact}
          onSubmit={submitContact}
          heading={`Contact ${orgQuery.data.organizationName}`}
          subheading="Your message is saved and sent to your organization administrators."
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      ) : platformQuery.data ? (
        <ContactPageView
          contact={platformQuery.data.contact}
          onSubmit={submitContact}
          heading="Get in Touch"
          subheading={
            isOrgAdmin
              ? 'Your message is saved and sent to platform support (Super Admin).'
              : `Reach the ${platformQuery.data.platformName} team — we are here to help.`
          }
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
