import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import AboutPageView from '../components/content/AboutPageView';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  OrganizationContentResponse,
  PlatformContentResponse,
} from '../types/content';

const About: React.FC = () => {
  const { user } = useAuth();
  const isOrgUser = user?.role === 'member' || user?.role === 'orgAdmin';

  const platformQuery = useQuery<PlatformContentResponse>({
    queryKey: ['platform-content'],
    queryFn: () => api.get('/public/platform-content').then((r) => r.data),
    enabled: !isOrgUser,
  });

  const orgQuery = useQuery<OrganizationContentResponse>({
    queryKey: ['organization-content'],
    queryFn: () => api.get('/public/organization-content').then((r) => r.data),
    enabled: isOrgUser,
  });

  const isLoading = isOrgUser ? orgQuery.isLoading : platformQuery.isLoading;
  const isError = isOrgUser ? orgQuery.isError : platformQuery.isError;

  return (
    <div className="min-h-screen bg-white font-poppins">
      <GuestNavbar />
      {isLoading ? (
        <div className="py-32 text-center text-gray-500">Loading...</div>
      ) : isError ? (
        <div className="py-32 text-center text-gray-500">
          Unable to load about information.
        </div>
      ) : isOrgUser && orgQuery.data ? (
        <AboutPageView
          content={orgQuery.data.about}
          organizationName={orgQuery.data.organizationName}
          showCta={false}
        />
      ) : platformQuery.data ? (
        <AboutPageView content={platformQuery.data.about} showCta />
      ) : (
        <div className="py-32 text-center text-gray-500">No content available.</div>
      )}
      <GuestFooter />
    </div>
  );
};

export default About;
