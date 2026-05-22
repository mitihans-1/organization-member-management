import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, MessageSquare, User, Image, FileText, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface EventMessage {
  id: string;
  eventId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  replyToId?: string;
  replyTo?: EventMessage & { sender: { id: string; name: string } };
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    profile_photo_path?: string;
  };
}

interface EventChatProps {
  eventId: string;
}

const EventChat: React.FC<EventChatProps> = ({ eventId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [usersTyping, setUsersTyping] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['event-messages', eventId],
    queryFn: () => api.get<EventMessage[]>(`/events/${eventId}/messages`).then(res => res.data),
    enabled: !!eventId,
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (socket) {
        socket.emit('sendEventMessage', {
          eventId,
          senderId: user?.id,
          attachmentUrl: data.url,
          attachmentType: data.type
        });
      }
      setSelectedFile(null);
      setUploadingFile(false);
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
      setUploadingFile(false);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; attachmentUrl?: string; attachmentType?: string }) => {
      return api.post(`/events/${eventId}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-messages', eventId] });
    },
  });

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      newSocket.emit('join', user.id);
      newSocket.emit('joinEventRoom', { eventId, userId: user.id });
      setSocket(newSocket);

      newSocket.on('receiveEventMessage', (message: EventMessage) => {
        refetchMessages();
      });

      newSocket.on('eventTypingIndicator', (data: { userId: string; isTyping: boolean }) => {
        setUsersTyping(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      return () => {
        newSocket.emit('leaveEventRoom', eventId);
        newSocket.disconnect();
      };
    }
  }, [user, eventId, refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedFile) return;

    if (selectedFile && !uploadingFile) {
      setUploadingFile(true);
      uploadFileMutation.mutate(selectedFile);
      return;
    }

    if (socket && messageInput.trim()) {
      socket.emit('sendEventMessage', {
        eventId,
        senderId: user?.id,
        content: messageInput,
      });
    }

    setMessageInput('');
    setIsTyping(false);
    if (socket) {
      socket.emit('eventTyping', {
        eventId,
        userId: user?.id,
        isTyping: false
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('eventTyping', {
        eventId,
        userId: user?.id,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('eventTyping', {
          eventId,
          userId: user?.id,
          isTyping: false
        });
      }
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          <h3 className="font-bold text-gray-900">Event Discussion</h3>
          {usersTyping.size > 0 && (
            <span className="text-xs text-indigo-600 font-medium ml-auto">
              {usersTyping.size} user{usersTyping.size > 1 ? 's' : ''} typing...
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages?.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isCurrentUser = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {msg.sender.profile_photo_path ? (
                      <img
                        src={`http://localhost:5000/${msg.sender.profile_photo_path}`}
                        alt={msg.sender.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl p-3 ${
                      isCurrentUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${isCurrentUser ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {msg.sender.name}
                    </p>
                    {msg.replyTo && (
                      <div className={`mb-2 p-2 rounded-lg text-xs ${isCurrentUser ? 'bg-indigo-700/50' : 'bg-gray-100'}`}>
                        <p className={`font-semibold ${isCurrentUser ? 'text-indigo-100' : 'text-gray-700'}`}>
                          {msg.replyTo.sender.name}
                        </p>
                        <p className={isCurrentUser ? 'text-indigo-100' : 'text-gray-600'}>
                          {msg.replyTo.content || 'Attachment'}
                        </p>
                      </div>
                    )}
                    {msg.attachmentUrl && (
                      <div className="mb-2">
                        {msg.attachmentType?.startsWith('image') ? (
                          <img
                            src={`http://localhost:5000/${msg.attachmentUrl}`}
                            alt="Attachment"
                            className="rounded-xl max-w-full max-h-48 object-cover"
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000/${msg.attachmentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg ${isCurrentUser ? 'bg-indigo-700/50 hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                          >
                            <FileText size={16} />
                            <span>View Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <span className={`text-[10px] ${isCurrentUser ? 'text-indigo-200' : 'text-gray-400'} mt-1 block text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFile.type.startsWith('image') ? <Image size={16} /> : <FileText size={16} />}
              <span className="text-sm text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <label className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <Paperclip size={20} />
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-none max-h-24"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={(!messageInput.trim() && !selectedFile) || uploadingFile}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {uploadingFile ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventChat;
