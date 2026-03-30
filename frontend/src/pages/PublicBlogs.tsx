import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Blog } from '../types';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';
import { Eye, Search } from 'lucide-react';

const FOREST = '#2D4A22';
const PAGE_SIZE = 4;

function formatStamp(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function excerpt(text: string, max = 140) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + '…';
}

function stableViews(id: number) {
  return 80 + (id * 47) % 420;
}

function tagForBlog(id: number): { label: string; urgent?: boolean } {
  const tags = [
    { label: 'general' },
    { label: 'urgent', urgent: true },
    { label: 'general' },
    { label: 'urgent', urgent: true },
  ];
  return tags[id % tags.length];
}

const PublicBlogs: React.FC = () => {
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['public-blogs'],
    queryFn: () => api.get('/blogs').then((res) => res.data),
  });

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
    <div className="min-h-screen bg-white font-poppins text-gray-900">
      <GuestNavbar />

      <section
        className="relative overflow-hidden py-16 sm:py-20 md:py-28 px-4"
        style={{
          backgroundImage: `linear-gradient(rgba(45, 74, 34, 0.88), rgba(45, 74, 34, 0.88)), url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=70)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Insights &amp; Stories
          </h1>
          <p className="text-white/90 text-lg sm:text-xl font-medium mb-10">
            Expert advice and best practices for membership organizations.
          </p>
          <div className="flex max-w-xl mx-auto bg-white rounded-full shadow-lg pl-5 pr-1.5 py-1.5 items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search articles..."
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-gray-800 placeholder:text-gray-400 text-[15px] py-2"
              aria-label="Search articles"
            />
            <button
              type="button"
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: FOREST }}
              aria-label="Search"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 inline-block">
            Featured Articles
          </h2>
          <div
            className="h-1 w-16 mx-auto mt-4 rounded-full"
            style={{ backgroundColor: FOREST }}
          />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 animate-pulse h-[420px]"
              />
            ))}
          </div>
        ) : !filtered.length ? (
          <p className="text-center text-gray-500 py-16 max-w-lg mx-auto leading-relaxed">
            {!blogs?.length ? (
              <>
                No articles have been published yet. When your team adds posts in the dashboard, they will appear here.
              </>
            ) : (
              <>No articles match your search. Try different keywords or clear the search box.</>
            )}
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-8">
              {shown.map((blog, index) => {
                const tag = tagForBlog(blog.id);
                return (
                  <article
                    key={blog.id}
                    className="bg-white rounded-2xl shadow-md shadow-gray-200/80 overflow-hidden border border-gray-100 flex flex-col"
                  >
                    <div className="relative h-48 sm:h-52 bg-gray-100 min-h-[12rem]">
                      <CoverImage
                        stored={blog.image}
                        slotIndex={index}
                        variant="blog"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 sm:p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-3 text-xs mb-3">
                        <span
                          className={
                            tag.urgent
                              ? 'px-2.5 py-0.5 rounded font-semibold bg-sky-600 text-white'
                              : 'px-2.5 py-0.5 rounded font-semibold bg-sky-500 text-white'
                          }
                        >
                          {tag.label}
                        </span>
                        <time
                          className="text-gray-500 font-medium tabular-nums shrink-0"
                          dateTime={blog.createdAt}
                        >
                          {formatStamp(blog.createdAt)}
                        </time>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1">
                        {excerpt(blog.content)}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: FOREST }}
                          >
                            {(blog.author_id ?? blog.id).toString().slice(-1) || 'A'}
                          </div>
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            Author
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={16} className="text-gray-400" />
                            {stableViews(blog.id)}
                          </span>
                          <span
                            className="font-semibold inline-flex items-center gap-0.5"
                            style={{ color: FOREST }}
                          >
                            Read More →
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full px-8 py-3 text-sm font-bold border-2 bg-white transition hover:bg-gray-50"
                  style={{ color: FOREST, borderColor: FOREST }}
                >
                  Load More Articles
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <section className="bg-gray-100 py-14 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-black mb-2" style={{ color: FOREST }}>
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-8 text-[15px]">
            Get tips and product news delivered to your inbox—no spam, unsubscribe anytime.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Your email address"
              className="flex-1 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-offset-0"
              style={{ boxShadow: `0 0 0 2px transparent` }}
            />
            <button
              type="submit"
              className="rounded-full px-8 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 transition"
              style={{ backgroundColor: FOREST }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <GuestFooter />
    </div>
  );
};

export default PublicBlogs;
