import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ContactMessage } from '../../types/contactMessage';
import { Mail, Check } from 'lucide-react';

interface ContactMessagesInboxProps {
  mode: 'organization' | 'platform';
  title: string;
  emptyHint: string;
}

const ContactMessagesInbox: React.FC<ContactMessagesInboxProps> = ({
  mode,
  title,
  emptyHint,
}) => {
  const queryClient = useQueryClient();
  const queryKey =
    mode === 'organization' ? ['org-contact-messages'] : ['platform-contact-messages'];

  const listUrl =
    mode === 'organization'
      ? '/organizations/me/contact-messages'
      : '/admin/contact-messages';

  const markUrl = (id: string) =>
    mode === 'organization'
      ? `/organizations/me/contact-messages/${id}/read`
      : `/admin/contact-messages/${id}/read`;

  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey,
    queryFn: () => api.get(listUrl).then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(markUrl(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unread = messages?.filter((m) => !m.isRead).length ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Mail size={18} />
          {title}
        </h3>
        {unread > 0 && (
          <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded-full">
            {unread} new
          </span>
        )}
      </div>
      {isLoading ? (
        <p className="p-6 text-sm text-gray-500">Loading messages...</p>
      ) : !messages?.length ? (
        <p className="p-6 text-sm text-gray-500">{emptyHint}</p>
      ) : (
        <ul className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`p-4 ${msg.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{msg.name}</span>
                    <span className="text-xs text-gray-500">{msg.email}</span>
                    {msg.senderRole && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {msg.senderRole}
                      </span>
                    )}
                    {mode === 'platform' && msg.organizationName && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {msg.organizationName}
                      </span>
                    )}
                  </div>
                  {msg.subject ? (
                    <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
                  ) : null}
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                {!msg.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate(msg.id)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    <Check size={14} />
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactMessagesInbox;
