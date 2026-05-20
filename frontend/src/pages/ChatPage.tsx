import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, MessageSquare, Check, CheckCheck, User, ChevronLeft, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    profile_photo_path?: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  participant1Id: string;
  participant2Id: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  participant1: {
    id: string;
    name: string;
    email: string;
    profile_photo_path?: string;
  };
  participant2: {
    id: string;
    name: string;
    email: string;
    profile_photo_path?: string;
  };
  messages: Message[];
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  profile_photo_path?: string;
  organization_name?: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => api.get('/chat/conversations').then(res => res.data),
    enabled: !!user,
  });

  const { data: chatableUsers } = useQuery({
    queryKey: ['chat-users'],
    queryFn: () => api.get('/chat/users').then(res => res.data),
    enabled: !!user,
  });

  const { data: conversationData, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedConversation?.id],
    queryFn: () => api.get(`/chat/conversations/${selectedConversation?.id}/messages`).then(res => res.data),
    enabled: !!selectedConversation?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; attachmentUrl?: string; attachmentType?: string }) => {
      if (!selectedConversation) return;
      return api.post(`/chat/conversations/${selectedConversation.id}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async (participant2Id: string) => {
      const type = user?.role === 'SuperAdmin' ? 'org_superadmin' : 'member_org';
      return api.post('/chat/conversations', {
        participant2Id,
        type,
        organizationId: user?.organizationId
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setSelectedConversation(data.data);
      setShowNewChat(false);
    },
    onError: (error: any) => {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation: ' + (error.response?.data?.message || 'Unknown error'));
    },
  });

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      newSocket.emit('join', user.id);
      setSocket(newSocket);

      newSocket.on('receiveMessage', (message: Message) => {
        if (message.conversationId === selectedConversation?.id) {
          refetchMessages();
        }
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      });

      newSocket.on('messageSent', (message: Message) => {
        if (message.conversationId === selectedConversation?.id) {
          refetchMessages();
        }
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      });

      newSocket.on('typingIndicator', (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== user.id) {
          setOtherUserTyping(data.isTyping);
        }
      });

      newSocket.on('messagesRead', () => {
        refetchMessages();
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, selectedConversation?.id, refetchMessages, queryClient]);

  useEffect(() => {
    if (selectedConversation && socket) {
      socket.emit('joinConversation', selectedConversation.id);
      socket.emit('markAsRead', { conversationId: selectedConversation.id, userId: user?.id });
    }
  }, [selectedConversation?.id, socket, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    if (socket) {
      socket.emit('sendMessage', {
        conversationId: selectedConversation.id,
        senderId: user?.id,
        content: messageInput,
      });
    }

    setMessageInput('');
    setIsTyping(false);
    if (socket) {
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        userId: user?.id,
        isTyping: false
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && selectedConversation && socket) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        userId: user?.id,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedConversation && socket) {
        socket.emit('typing', {
          conversationId: selectedConversation.id,
          userId: user?.id,
          isTyping: false
        });
      }
    }, 2000);
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participant1Id === user?.id ? conv.participant2 : conv.participant1;
  };

  const getLastMessage = (conv: Conversation) => {
    if (conv.messages && conv.messages.length > 0) {
      return conv.messages[0];
    }
    return null;
  };

  const getUnreadCount = (conv: Conversation) => {
    if (!conv.messages) return 0;
    return conv.messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
  };

  const filteredChatableUsers = chatableUsers?.filter((u: ChatUser) => 
    !conversations?.some((c: Conversation) => 
      c.participant1Id === u.id || c.participant2Id === u.id
    )
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Conversations List */}
      <div className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Messages</h1>
              <p className="text-sm text-gray-500 mt-1">Your conversations</p>
            </div>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-gray-700 mb-3">Start a new chat</h3>
              {filteredChatableUsers?.map((chatUser: ChatUser) => (
                <button
                  key={chatUser.id}
                  onClick={() => startConversationMutation.mutate(chatUser.id)}
                  disabled={startConversationMutation.isPending}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border border-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {chatUser.profile_photo_path ? (
                      <img src={chatUser.profile_photo_path} alt={chatUser.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{chatUser.name}</h3>
                    {chatUser.organization_name && (
                      <p className="text-xs text-gray-500">{chatUser.organization_name}</p>
                    )}
                  </div>
                  {startConversationMutation.isPending && startConversationMutation.variables === chatUser.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                  )}
                </button>
              ))}
              {filteredChatableUsers?.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users available to chat with</p>
              )}
            </div>
          ) : conversationsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-2">Click + to start a new chat</p>
            </div>
          ) : (
            conversations?.map((conv: Conversation) => {
              const other = getOtherParticipant(conv);
              const lastMsg = getLastMessage(conv);
              const unreadCount = getUnreadCount(conv);
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {other.profile_photo_path ? (
                      <img src={other.profile_photo_path} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 truncate">{other.name}</h3>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lastMsg ? (lastMsg.content || 'Attachment') : 'Start a conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              {(() => {
                const other = getOtherParticipant(selectedConversation);
                return (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {other.profile_photo_path ? (
                        <img src={other.profile_photo_path} alt={other.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{other.name}</h3>
                      {otherUserTyping && (
                        <p className="text-xs text-indigo-600 font-medium">Typing...</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {conversationData?.messages?.map((msg: Message) => {
                console.log('msg.senderId:', msg.senderId, 'user.id:', user?.id);
                const isCurrentUser = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-4 ${
                        isCurrentUser
                          ? 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                          : 'bg-indigo-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {msg.attachmentUrl && (
                        <div className="mb-2">
                          {msg.attachmentType?.startsWith('image') ? (
                            <img
                              src={`http://localhost:5000/${msg.attachmentUrl}`}
                              alt="Attachment"
                              className="rounded-xl max-w-full"
                            />
                          ) : (
                            <a
                              href={`http://localhost:5000/${msg.attachmentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline ${isCurrentUser ? 'text-indigo-600' : 'text-indigo-100'}`}
                            >
                              View Attachment
                            </a>
                          )}
                        </div>
                      )}
                      {msg.content && <p className="text-sm">{msg.content}</p>}
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCurrentUser && (
                          msg.isRead ? (
                            <CheckCheck size={14} className="text-blue-300" />
                          ) : (
                            <Check size={14} className="opacity-50" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {otherUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-200 px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <button
                  type="button"
                  className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-none max-h-32"
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
