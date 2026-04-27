import React from 'react';
import { X, Clock, Tag, Eye } from 'lucide-react';
import { Blog } from '../types';
import CoverImage from './CoverImage';

const FOREST = '#2D4A22';

interface BlogDetailsModalProps {
  blog: Blog;
  blogs?: Blog[]; // To provide context for CoverImage indexing
  onClose: () => void;
}

function formatStamp(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function stableViews(id: string) {
  let num = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      num += id.charCodeAt(i);
    }
  }
  return 80 + (num * 47) % 420;
}

const BlogDetailsModal: React.FC<BlogDetailsModalProps> = ({
  blog,
  blogs,
  onClose,
}) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="w-full h-64 sm:h-80 bg-gray-100 relative shrink-0">
          <CoverImage
            stored={blog.image}
            slotIndex={blogs ? blogs.findIndex((b) => b.id === blog.id) : 0}
            variant="blog"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className="px-3 py-1 bg-sky-50 text-sky-700 text-sm font-bold rounded-full capitalize border border-sky-100">
                {blog.category || 'General'}
              </span>
              <time className="text-gray-500 text-sm font-medium ml-2">
                {formatStamp(blog.createdAt)}
              </time>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">
              {blog.title}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-3 items-center text-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: FOREST }}
                >
                  {(blog.author_id ?? blog.id).toString().slice(-1) || 'A'}
                </div>
                <span className="font-semibold text-gray-900">
                  {blog.author?.name || 'Author'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{stableViews(blog.id)} views</span>
              </div>

              {blog.readTime && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{blog.readTime} min read</span>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-10">
              {blog.content}
            </div>

            {blog.tags && (
              <div className="flex flex-wrap gap-2 items-center mt-8 pt-6 border-t border-gray-100">
                <Tag size={16} className="text-gray-400 mr-1" />
                {blog.tags.split(',').map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full lowercase">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailsModal;
