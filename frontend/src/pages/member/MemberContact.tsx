import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { OrganizationContentResponse } from '../../types/content';
import ContactPageView from '../../components/content/ContactPageView';

const MemberContact: React.FC = () => {
  const { user } = useAuth();

  const orgContentQuery = useQuery<OrganizationContentResponse>({
    queryKey: ['organization-content'],
    queryFn: () => api.get('/public/organization-content').then((r) => r.data),
  });

  const submitContact = async (form: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    return api.post('/public/contact', form);
  };

  const isLoading = orgContentQuery.isLoading;
  const isError = orgContentQuery.isError;

  const defaultName = user?.name || '';
  const defaultEmail = user?.email || '';

  return (
    <div className="max-w-5xl space-y-6 font-poppins">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Contact Your Organization</h1>
        <p className="text-sm text-slate-500">
          Reach out to your organization's administrators with questions or concerns.
        </p>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading...</div>
      ) : isError ? (
        <div className="py-10 text-center text-gray-500">
          Unable to load contact information.
        </div>
      ) : orgContentQuery.data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <ContactPageView
            contact={orgContentQuery.data.contact}
            onSubmit={submitContact}
            heading="Contact Your Organization"
            subheading={`Reach out to ${orgContentQuery.data.organizationName} administrators — they are here to help.`}
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            successMessage="Thank you for reaching out to your organization. They will get back to you shortly."
          />
        </div>
      ) : (
        <div className="py-10 text-center text-gray-500">No contact information available.</div>
      )}
    </div>
  );
};

export default MemberContact;
