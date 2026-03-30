import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Users, Calendar, BookOpen, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(res => res.data),
    enabled: user?.role === 'organAdmin' || user?.role === 'SuperAdmin',
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(res => res.data),
    enabled: user?.role === 'organAdmin' || user?.role === 'member',
  });

  const getIcon = (label: string) => {
    switch (label) {
      case 'Total Organizations':
      case 'Total Members': return <Users className="text-brand-medium" />;
      case 'Upcoming Events': return <Calendar className="text-brand-medium" />;
      case 'Recent Blogs': return <BookOpen className="text-brand-medium" />;
      case 'Total Revenue': return <CreditCard className="text-brand-medium" />;
      default: return <TrendingUp className="text-brand-deep" />;
    }
  };

  const getBg = (label: string) => {
    switch (label) {
      case 'Total Organizations':
      case 'Total Members':
      case 'Upcoming Events':
      case 'Recent Blogs':
      case 'Total Revenue': return 'bg-brand-pale/20';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Plan Warning for organAdmin/member */}
      {user?.role !== 'SuperAdmin' && dashboardData?.expiry && (
        <div className="bg-brand-pale/30 border-l-4 border-brand-medium p-5 rounded-r-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="text-brand-medium mr-4" />
            <div>
              <p className="text-sm text-brand-dark font-bold">
                Your <span className="text-brand-medium">{dashboardData.plan?.name}</span> plan expires on {new Date(dashboardData.expiry).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            to="/org/upgrade"
            className="bg-brand-medium text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-brand-light transition-all inline-block"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
           [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>)
        ) : (
          dashboardData?.stats.map((stat: any, index: number) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl ${getBg(stat.label)}`}>
                {getIcon(stat.label)}
              </div>
              <div>
                <p className="text-xs text-brand-deep font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-brand-dark">{stat.value}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Members (Only for Admins) */}
        {(user?.role === 'organAdmin' || user?.role === 'SuperAdmin') && (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-brand-dark tracking-tight">Recent Members</h3>
              <button className="text-brand-medium text-sm font-bold hover:underline uppercase tracking-widest">View All</button>
            </div>
            {membersLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl"></div>)}
              </div>
            ) : (
              <div className="space-y-4">
                {members?.slice(0, 5).map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-4">
                      <img src={`https://ui-avatars.com/api/?name=${member.name}&background=ecf39e&color=132a13`} alt="" className="w-12 h-12 rounded-xl shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-brand-dark">{member.name}</p>
                        <p className="text-xs text-brand-deep font-medium">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-brand-medium uppercase bg-brand-pale/30 px-2 py-1 rounded-lg">{member.role}</span>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-8">No members found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events (For everyone) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-brand-dark tracking-tight">Upcoming Events</h3>
            <button className="text-brand-medium text-sm font-bold hover:underline uppercase tracking-widest">Explore</button>
          </div>
          {eventsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl"></div>)}
            </div>
          ) : (
            <div className="space-y-4">
              {events?.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex items-center space-x-5 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="bg-brand-pale/30 text-brand-medium p-3 rounded-xl text-center min-w-[60px] shadow-sm border border-brand-pale/50">
                    <p className="text-[10px] font-black uppercase tracking-tighter">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-xl font-black leading-none">{new Date(event.date).getDate()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{event.title}</p>
                    <p className="text-xs text-brand-deep font-medium flex items-center">
                      <span className="w-1.5 h-1.5 bg-brand-medium rounded-full mr-2"></span>
                      {event.location}
                    </p>
                  </div>
                </div>
              ))}
              {(!events || events.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming events</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
