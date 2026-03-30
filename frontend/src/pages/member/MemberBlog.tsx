import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Blog } from '../../types';
import CoverImage from '../../components/CoverImage';
import { Search, ExternalLink } from 'lucide-react';

const MemberBlog: React.FC = () => {
  const [q, setQ] = useState('');

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: () => api.get('/blogs').then((r) => r.data),
  });

  const filtered = useMemo(() => {
    if (!blogs?.length) return [];
    const s = q.trim().toLowerCase();
    if (!s) return blogs;
    return blogs.filter(
      (b) => b.title.toLowerCase().includes(s) || b.content.toLowerCase().includes(s)
    );
  }, [blogs, q]);

  return (
    <div className="max-w-3xl space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Blog</h1>
          <p className="text-sm text-slate-500">Posts from your organization</p>
        </div>
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:underline"
        >
          Public blog site
          <ExternalLink size={16} />
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <p className="text-slate-500 text-sm">No posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((b, index) => (
            <li
              key={b.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row"
            >
              <div className="relative sm:w-40 h-36 sm:h-auto shrink-0 bg-slate-100">
                <CoverImage
                  stored={b.image}
                  slotIndex={index}
                  variant="blog"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 min-w-0">
                <h2 className="font-black text-slate-900">{b.title}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}
                </p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                  {b.content.replace(/\s+/g, ' ').slice(0, 200)}
                  {b.content.length > 200 ? '…' : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberBlog;
