import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { ContactContent } from '../../types/content';

interface ContactPageViewProps {
  contact: ContactContent;
  onSubmit: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<unknown>;
  heading?: string;
  subheading?: string;
  defaultName?: string;
  defaultEmail?: string;
  successMessage?: string;
}

const ContactPageView: React.FC<ContactPageViewProps> = ({
  contact,
  onSubmit,
  heading = 'Get in Touch',
  subheading = 'Have questions? Our team is here to help.',
  defaultName = '',
  defaultEmail = '',
  successMessage = 'Thank you for reaching out. We will get back to you shortly.',
}) => {
  const [formData, setFormData] = useState({
    name: defaultName,
    email: defaultEmail,
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (defaultName) setFormData((f) => ({ ...f, name: defaultName }));
    if (defaultEmail) setFormData((f) => ({ ...f, email: defaultEmail }));
  }, [defaultName, defaultEmail]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [successText, setSuccessText] = useState(successMessage);
  const [error, setError] = useState<string | null>(null);

  const contactInfo = [
    { label: 'Email', value: contact.email, icon: <Mail size={24} /> },
    { label: 'Phone', value: contact.phone, icon: <Phone size={24} /> },
    { label: 'Address', value: contact.address, icon: <MapPin size={24} /> },
    { label: 'Hours', value: contact.hours, icon: <Clock size={24} /> },
  ].filter((c) => c.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await onSubmit(formData);
      const msg =
        (res as { data?: { message?: string } })?.data?.message || successMessage;
      setSuccessText(msg);
      setSent(true);
      setFormData({
        name: defaultName,
        email: defaultEmail,
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative pt-24 pb-32 bg-brand-pale/10 overflow-hidden text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <h1 className="text-5xl md:text-6xl font-black text-brand-dark leading-tight tracking-tight">
            {heading}
          </h1>
          <p className="text-xl text-brand-deep max-w-3xl mx-auto leading-relaxed font-medium">
            {subheading}
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-16">
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-brand-dark tracking-tight">
                Contact Information
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-md text-lg font-medium">
                Reach out through any of these channels.
              </p>
            </div>
            {contactInfo.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {contactInfo.map((info) => (
                  <div
                    key={info.label}
                    className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 flex flex-col space-y-6"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-brand-medium">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-brand-deep uppercase tracking-widest mb-2">
                        {info.label}
                      </h4>
                      <p className="text-brand-dark font-bold text-lg break-words">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Contact details will appear here once configured.</p>
            )}
            {contact.showLiveChat && contact.liveChatUrl ? (
              <div className="p-10 rounded-[2.5rem] bg-brand-medium text-white flex items-center justify-between gap-8 shadow-2xl">
                <div>
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-wide">Live Chat</h3>
                  <p className="text-brand-pale/80 text-sm font-bold">Chat with us for instant support.</p>
                </div>
                <a
                  href={contact.liveChatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white text-brand-medium px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2"
                >
                  <MessageSquare size={20} />
                  Start Chat
                </a>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-12 relative">
            {sent ? (
              <div className="text-center py-20 space-y-10">
                <div className="w-24 h-24 bg-brand-pale/30 text-brand-medium rounded-full flex items-center justify-center mx-auto">
                  <Send size={48} />
                </div>
                <h3 className="text-4xl font-black text-brand-dark">Message Sent!</h3>
                <p className="text-gray-600 max-w-sm mx-auto text-lg font-medium">{successText}</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-brand-medium font-black hover:underline uppercase tracking-widest text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <h2 className="text-3xl font-black text-brand-dark mb-10 tracking-tight">
                  Send Us a Message
                </h2>
                {error ? (
                  <p className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                      Your Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 bg-gray-50 font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 bg-gray-50 font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border-2 border-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 bg-gray-50 font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border-2 border-gray-50 rounded-2xl px-6 py-4 focus:border-brand-medium focus:ring-0 bg-gray-50 font-medium resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-medium text-white py-5 rounded-2xl font-black text-lg hover:bg-brand-light transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                  <Send size={20} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPageView;
