import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User, Clock, Share2, Bookmark, MessageSquare, ChevronRight, Eye } from 'lucide-react';
import api from '../services/api';
import { Blog } from '../types';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';

const FOREST = '#2D4A22';

function formatStamp(iso: string) {
  const d = new Date(iso);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
}

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [readingProgress, setReadingProgress] = React.useState(0);
  const [commentName, setCommentName] = React.useState('');
  const [commentBody, setCommentBody] = React.useState('');
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [likes, setLikes] = React.useState(0);

  const { data: blog, isLoading, error } = useQuery<Blog>({
    queryKey: ['blog', id],
    queryFn: () => api.get(`/blogs/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  const { data: comments, refetch: refetchComments } = useQuery<any[]>({
    queryKey: ['blog-comments', id],
    queryFn: () => api.get(`/blogs/${id}/comments`).then((res) => res.data),
    enabled: !!id,
  });

  const { data: suggestions } = useQuery<Blog[]>({
    queryKey: ['suggested-blogs', blog?.category],
    queryFn: () => api.get('/blogs').then((res) => 
      (res.data as Blog[]).filter(b => b.category === blog?.category && b.id !== blog?.id).slice(0, 3)
    ),
    enabled: !!blog?.category,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem(`blog_bookmark_${id}`);
    setIsBookmarked(!!saved);
    setLikes(Math.floor(Math.random() * 50) + 120); // Mock starting likes
  }, [id]);

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height === 0) setReadingProgress(0);
      else setReadingProgress((scrolled / height) * 100);
    };
    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this article: ${blog?.title}`;
    let shareUrl = '';
    
    if (platform === 'ts') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'fb') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'li') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const toggleBookmark = () => {
    if (isBookmarked) {
      localStorage.removeItem(`blog_bookmark_${id}`);
    } else {
      localStorage.setItem(`blog_bookmark_${id}`, 'true');
    }
    setIsBookmarked(!isBookmarked);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentBody) return;
    try {
      await api.post(`/blogs/${id}/comments`, { author: commentName, content: commentBody });
      setCommentName('');
      setCommentBody('');
      refetchComments();
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <GuestNavbar />
// ... (rest of the component) ...
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: FOREST }}></div>
        </div>
        <GuestFooter />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <GuestNavbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8 max-w-md">The article you are looking for might have been moved or deleted.</p>
          <Link 
            to="/blogs" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold transition-all hover:scale-105"
            style={{ backgroundColor: FOREST }}
          >
            <ArrowLeft size={20} />
            Back to All Articles
          </Link>
        </div>
        <GuestFooter />
      </div>
    );
  }

  // Estimate reading time
  const wordCount = blog.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-white font-poppins selection:bg-[#2D4A22]/10">
      <GuestNavbar />

      {/* Reading Progress Bar */}
      <div 
        className="fixed top-20 left-0 h-1 z-[60] transition-all duration-300"
        style={{ width: `${readingProgress}%`, backgroundColor: FOREST }}
      />

      {/* Hero Header */}
      <header className="relative w-full h-[60vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <CoverImage 
            stored={blog.image} 
            slotIndex={0} 
            variant="blog" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full max-w-4xl mx-auto px-4 flex flex-col justify-end pb-12 sm:pb-20">
          <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in-up">
            <span 
              className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white backdrop-blur-md bg-white/20 border border-white/30"
            >
              {blog.category || 'Insights'}
            </span>
            <span className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
              <Clock size={16} />
              {readingTime} min read
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight animate-fade-in-up [animation-delay:100ms]">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 animate-fade-in-up [animation-delay:200ms]">
             <div 
               className="w-12 h-12 rounded-full ring-2 ring-white/50 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-xl"
               style={{ backgroundColor: FOREST }}
             >
               {(blog.author?.name || 'A').charAt(0)}
             </div>
             <div className="flex flex-col text-white">
               <span className="font-bold text-lg leading-tight">{blog.author?.name || 'OMMS Expert'}</span>
               <span className="text-white/70 text-sm flex items-center gap-1.5">
                 <Calendar size={14} />
                 {formatStamp(blog.createdAt)}
               </span>
             </div>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20 flex flex-col md:flex-row gap-12">
        {/* Sticky Actions Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-6 sticky top-32 h-fit text-gray-400">
           <button 
             onClick={() => handleShare('ts')}
             className="p-3 rounded-full hover:bg-gray-100 hover:text-[#1DA1F2] transition-all group" 
             title="Share on X"
           >
              <Share2 size={22} className="group-hover:scale-110 transition-transform" />
           </button>
           <button 
             onClick={toggleBookmark}
             className={`p-3 rounded-full transition-all group ${isBookmarked ? 'bg-[#2D4A22]/10 text-[#2D4A22]' : 'hover:bg-gray-100 hover:text-gray-900'}`} 
             title={isBookmarked ? "Bookmarked" : "Bookmark"}
           >
              <Bookmark size={22} className={`${isBookmarked ? 'fill-current' : 'group-hover:scale-110'} transition-transform`} />
           </button>
           <button 
             onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
             className="p-3 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-all group" 
             title="Comments"
           >
              <MessageSquare size={22} className="group-hover:scale-110 transition-transform" />
           </button>
           <div className="h-px w-full bg-gray-100 my-2" />
           <span className="text-xs font-black uppercase tracking-widest text-gray-300 vertical-text py-2">Story</span>
        </aside>

        {/* Article Body */}
        <div className="flex-1 min-w-0">
          <div 
            className="prose prose-lg sm:prose-xl prose-stone max-w-none 
              prose-headings:font-black prose-headings:tracking-tight 
              prose-p:text-gray-600 prose-p:leading-[1.8]
              prose-a:text-[#2D4A22] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-black
              prose-img:rounded-3xl prose-img:shadow-2xl
              prose-blockquote:border-[#2D4A22] prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic"
          >
            {blog.content.split('\n').map((para, idx) => (
              para.trim() ? <p key={idx}>{para}</p> : <br key={idx} />
            ))}
          </div>

          <hr className="my-16 border-gray-100" />

          {/* Comments Section */}
          <section id="comments-section" className="mb-20">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Community Discussion</h3>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {comments?.length || 0} Comments
                </span>
             </div>

             <form onSubmit={submitComment} className="mb-12 bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                   <input 
                     type="text" 
                     value={commentName}
                     onChange={(e) => setCommentName(e.target.value)}
                     placeholder="Your Name" 
                     required
                     className="px-5 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#2D4A22]/10 transition-all"
                   />
                   <div className="hidden sm:block" />
                </div>
                <textarea 
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Share your thoughts..." 
                  required
                  rows={4}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#2D4A22]/10 transition-all mb-4 resize-none"
                />
                <button 
                  type="submit"
                  className="px-8 py-3 rounded-full text-white font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: FOREST }}
                >
                  Post Comment
                </button>
             </form>

             <div className="space-y-6">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-4 p-6 rounded-2xl border border-gray-50 bg-white shadow-sm animate-fade-in-up">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0" style={{ backgroundColor: FOREST }}>
                        {comment.author.charAt(0)}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-black text-gray-900">{comment.author}</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatStamp(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-[15px]">{comment.content}</p>
                     </div>
                  </div>
                ))}
                {comments?.length === 0 && (
                  <div className="text-center py-10 text-gray-400 font-medium">
                     No comments yet. Be the first to join the conversation!
                  </div>
                )}
             </div>
          </section>

          {/* Article Footer / About Author */}
          <div className="bg-gray-50 rounded-[2.5rem] p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 border border-gray-100 shadow-sm overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D4A22]/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
             
             <div 
               className="w-24 h-24 rounded-3xl shrink-0 flex items-center justify-center text-white font-black text-3xl shadow-2xl relative z-10 overflow-hidden transform group-hover:-rotate-3 transition-transform"
               style={{ backgroundColor: FOREST }}
             >
               {(blog.author?.name || 'A').charAt(0)}
             </div>

             <div className="flex-1 text-center sm:text-left relative z-10">
               <span className="text-xs font-black uppercase tracking-[0.2em] text-[#2D4A22] mb-1 block">Written by</span>
               <h3 className="text-2xl font-black text-gray-900 mb-2">{blog.author?.name || 'OMMS Editorial Team'}</h3>
               <p className="text-gray-500 leading-relaxed max-w-lg">
                 Expert contributor focused on technology, leadership, and operational efficiency for modern member organizations.
               </p>
             </div>
          </div>
          
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6">
             <Link 
               to="/blogs" 
               className="group inline-flex items-center gap-3 py-4 px-8 rounded-full border-2 border-gray-100 text-gray-900 font-black hover:border-[#2D4A22] hover:text-[#2D4A22] transition-all"
             >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to all insights
             </Link>
             
             <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400">Share this story</span>
                <div className="flex gap-2">
                   <button onClick={() => handleShare('ts')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all cursor-pointer text-gray-400 shadow-sm border border-gray-100">
                      <Share2 size={16} />
                   </button>
                   <button onClick={() => handleShare('fb')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-[#4267B2] hover:text-white transition-all cursor-pointer text-gray-400 shadow-sm border border-gray-100">
                      <Share2 size={16} />
                   </button>
                   <button onClick={() => handleShare('li')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-all cursor-pointer text-gray-400 shadow-sm border border-gray-100">
                      <Share2 size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Suggested Articles section */}
      {suggestions && suggestions.length > 0 && (
        <section className="bg-gray-50/50 py-20 border-t border-gray-100">
           <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-end justify-between mb-12">
                 <div>
                   <span className="text-xs font-black uppercase tracking-[0.3em] text-[#2D4A22] mb-2 block">Read Next</span>
                   <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Related Insights</h2>
                 </div>
                 <Link to="/blogs" className="hidden sm:inline-flex items-center gap-2 font-black text-[#2D4A22] group">
                   Explore all <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {suggestions.map((s, idx) => (
                   <Link 
                     key={s.id} 
                     to={`/blogs/${s.id}`}
                     className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/50 animate-fade-in-up"
                     style={{ animationDelay: `${idx * 100}ms` }}
                   >
                      <div className="relative h-56 overflow-hidden">
                         <CoverImage stored={s.image} slotIndex={idx} variant="blog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                         <div className="absolute inset-0 bg-[#2D4A22]/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                         <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-[#2D4A22] uppercase tracking-widest w-fit mb-4">{s.category}</span>
                         <h3 className="text-lg font-black text-gray-900 mb-4 group-hover:text-[#2D4A22] transition-colors line-clamp-2">{s.title}</h3>
                         <div className="mt-auto flex items-center justify-between text-gray-400">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: FOREST }}>
                                  {s.title.charAt(0)}
                               </div>
                               <span className="text-xs font-bold">Expert Post</span>
                            </div>
                            <Eye size={16} />
                         </div>
                      </div>
                   </Link>
                 ))}
              </div>
           </div>
        </section>
      )}

      <GuestFooter />
      
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;
