import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Event } from '../types';
import { Plus, Search, Calendar as CalendarIcon, MapPin, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CoverImage from '../components/CoverImage';

const Events: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', image: '' });

  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'organAdmin' || user?.role === 'SuperAdmin';

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newEvent: any) => api.post('/events', newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedEvent: any) => api.put(`/events/${updatedEvent.id}`, updatedEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: new Date(event.date).toISOString().split('T')[0],
        location: event.location || '',
        image: event.image || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', date: '', location: '', image: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ ...formData, id: editingEvent.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-brand-dark tracking-tight">Events</h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="bg-brand-medium text-white px-5 py-2.5 rounded-2xl flex items-center space-x-2 hover:bg-brand-light transition-all shadow-lg shadow-brand-medium/20 font-bold"
          >
            <Plus size={20} />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2rem]"></div>)}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-brand-pale/50">
           <CalendarIcon className="mx-auto text-brand-pale mb-4" size={64} />
           <p className="text-brand-deep font-bold text-lg">No events found. Start by creating one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events?.map((event, index) => (
            <div key={event.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden min-h-[12rem]">
                <CoverImage
                  stored={event.image}
                  slotIndex={index}
                  variant="event"
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title='admin validation' onClick={() => openModal(event)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:text-brand-medium transition-colors"><Edit2 size={16} /></button>
                    <button title='admin deletion' onClick={() => deleteMutation.mutate(event.id)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-brand-dark mb-3 group-hover:text-brand-medium transition-colors leading-tight">{event.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-6 font-medium">{event.description}</p>
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center text-xs font-bold text-brand-deep space-x-2">
                    <CalendarIcon size={14} className="text-brand-medium" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center text-xs font-bold text-brand-deep space-x-2">
                      <MapPin size={14} className="text-brand-medium" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-brand-dark tracking-tight">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button title='model validatin' onClick={closeModal} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-brand-dark"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="e.g. Annual Meeting"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="Tell us about the event..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Date</label>
                  <input
                  title='form edition'
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                    placeholder="Online or Address"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Cover Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="pt-6 flex space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 border-2 border-gray-50 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 hover:text-brand-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-brand-medium text-white rounded-2xl font-black hover:bg-brand-light transition-all shadow-xl shadow-brand-medium/20"
                >
                  {editingEvent ? 'Update' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
