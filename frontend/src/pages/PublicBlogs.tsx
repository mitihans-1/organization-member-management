import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Blog } from '../types';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';
import { Eye, Search, ArrowRight, Clock, Calendar, ChevronRight } from 'lucide-react';

const FOREST = '#2D4A22';
const PAGE_SIZE = 6;

function formatStamp(iso: string) {
  const d = new Date(iso);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
}

function excerpt(text: string, max = 120) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + '…';
}

const PublicBlogs: React.FC = () => {
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subStatus, setSubStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['public-blogs'],
    queryFn: () => api.get('/blogs').then((res) => res.data),
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubStatus(null);
    try {
      await api.post('/subscriptions/subscribe', { email });
      setSubStatus({ type: 'success', msg: 'Thanks for subscribing!' });
      setEmail('');
    } catch (err) {
      setSubStatus({ type: 'error', msg: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!blogs?.length) return [];
    const s = q.trim().toLowerCase();
    if (!s) return blogs;
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(s) || b.content.toLowerCase().includes(s)
    );
  }, [blogs, q]);

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-poppins selection:bg-[#2D4A22]/10">
      <GuestNavbar />

      {/* Modern Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-[#2D4A22]">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-24 -translate-x-24 w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 animate-fade-in">
            OMMS Insights
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8 animate-fade-in-up">
            Knowledge for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">Modern Communities</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:100ms]">
            Discover expert strategies, success stories, and deep dives into membership management excellence.
          </p>
          
          <div className="flex max-w-xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 items-center gap-2 animate-fade-in-up [animation-delay:200ms]">
            <div className="pl-4 text-white/50">
              <Search size={22} />
            </div>
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search by topic or keyword..."
              className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-white/40 text-lg py-3 px-2"
              aria-label="Search articles"
            />
            <button
              type="button"
              className="bg-white text-[#2D4A22] h-12 px-6 rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24 relative z-20">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-[2.5rem] bg-white border border-gray-100 shadow-sm h-[500px] animate-pulse"
              />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-xl max-w-2xl mx-auto mt-20">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-200" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">No articles found</h3>
             <p className="text-gray-500 mb-8">Try adjusting your search terms or keywords.</p>
             <button 
               onClick={() => setQ('')}
               className="font-black text-[#2D4A22] flex items-center gap-2 mx-auto hover:gap-3 transition-all"
             >
                Clear search <ChevronRight size={20} />
             </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {shown.map((blog, index) => (
              <article
                key={blog.id}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-700 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link to={`/blogs/${blog.id}`} className="block relative h-64 overflow-hidden">
                  <CoverImage
                    stored={blog.image}
                    slotIndex={index}
                    variant="blog"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-700" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-white text-[10px] font-black uppercase tracking-wider text-[#2D4A22] shadow-sm">
                      {blog.category || 'Insights'}
                    </span>
                  </div>
                </Link>

                <div className="p-8 sm:p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-5 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 font-black text-[#2D4A22]">
                      <Calendar size={14} />
                      {formatStamp(blog.createdAt)}
                    </span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      5 min read
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 group-hover:text-[#2D4A22] transition-colors line-clamp-2">
                    <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
                  </h3>
                  
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-8 flex-1 line-clamp-3">
                    {excerpt(blog.content)}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                       <div 
                         className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl"
                         style={{ backgroundColor: FOREST }}
                       >
                         {(blog.author_id ?? blog.id).toString().slice(-1) || 'A'}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-black text-gray-900">Expert Team</span>
                         <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Contributor</span>
                       </div>
                    </div>
                    <Link 
                      to={`/blogs/${blog.id}`} 
                      className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#2D4A22] group-hover:text-white group-hover:shadow-xl transition-all duration-500 transform group-hover:rotate-12"
                    >
                       <ArrowRight size={22} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-20">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="bg-white border-2 border-gray-100 px-10 py-4 rounded-full font-black text-[#2D4A22] hover:border-[#2D4A22] hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0"
            >
              Load More Insights
            </button>
          </div>
        )}
      </main>

      {/* Modern Newsletter Section */}
      <section className="bg-white py-32 px-4 border-t border-gray-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] pointer-events-none opacity-[0.03]">
           <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=70" className="w-full h-full object-cover grayscale" alt="" />
        </div>
        
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
           <div className="lg:w-1/2 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D4A22] mb-4 block">Our Newsletter</span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight">Join 5,000+ community leaders</h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto lg:ml-0">
                Weekly insights on membership growth, tech trends, and community building delivered straight to your inbox.
              </p>
           </div>
           
           <div className="lg:w-1/2 w-full">
              <form 
                className="bg-white p-2 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col sm:flex-row gap-2"
                onSubmit={handleSubscribe}
              >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#2D4A22]/10 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#2D4A22] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
              </form>
              {subStatus && (
                <p className={`mt-4 text-sm font-bold ${subStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {subStatus.msg}
                </p>
              )}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-8 opacity-40">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-2">✔ No spam ever</span>
                <span className="text-xs font-bold text-gray-400 flex items-center gap-2">✔ Unsubscribe anytime</span>
              </div>
           </div>
        </div>
      </section>

      <GuestFooter />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default PublicBlogs;
