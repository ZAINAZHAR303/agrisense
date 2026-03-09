"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthModal from "@/components/AuthModal";
import { uploadToCloudinary } from "@/utils/cloudinary";

const API_URL = 'http://localhost:5000/api';
const COMMENTS_PREVIEW = 2;

// ─── Shared helpers ────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = "md" }) => {
  const sz = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-11 h-11", xl: "w-14 h-14" }[size];
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=16a34a&color=fff&bold=true`}
      alt={name || 'User'}
      className={`${sz} rounded-full object-cover flex-shrink-0`}
    />
  );
};

const timeAgo = (date) => {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── PostCard (Facebook-style inline comments) ────────────────────────────────

const PostCard = ({ post, user, token, posts, onPostsUpdate, onAuthRequired }) => {
  const [showAll, setShowAll] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);

  const comments = post.comments || [];
  const hidden = comments.length - COMMENTS_PREVIEW;
  const visible = showAll ? comments : comments.slice(-COMMENTS_PREVIEW);
  const liked = user && post.likes?.some(l => l.userId === user.id);
  const tok = () => token || localStorage.getItem('token');

  const openComment = () => {
    if (!user) { onAuthRequired(); return; }
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleLike = async () => {
    if (!user) { onAuthRequired(); return; }
    try {
      const res = await fetch(`${API_URL}/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok()}` },
        body: JSON.stringify({ postId: post.id }),
      });
      const d = await res.json();
      if (d.success) onPostsUpdate(posts.map(p => p.id !== post.id ? p : {
        ...p,
        likes: d.liked
          ? [...(p.likes || []), { userId: user.id }]
          : (p.likes || []).filter(l => l.userId !== user.id),
      }));
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/posts/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok()}` },
        body: JSON.stringify({ postId: post.id, text: commentText }),
      });
      const d = await res.json();
      if (d.success) {
        onPostsUpdate(posts.map(p => p.id !== post.id ? p : {
          ...p, comments: [...(p.comments || []), d.comment],
        }));
        setCommentText('');
        setShowAll(true);
      }
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${tok()}` },
      });
      const d = await res.json();
      if (d.success) onPostsUpdate(posts.filter(p => p.id !== post.id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar src={post.user?.avatar} name={post.user?.name} size="lg" />
          <div>
            <p className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight">{post.user?.name || 'Unknown'}</p>
            <p className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
              {timeAgo(post.createdAt)}
              <span>·</span>
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
              <span className="text-green-500 font-medium">Public</span>
            </p>
          </div>
        </div>
        {user?.id === post.userId && (
          <button
            onClick={handleDelete}
            title="Delete post"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {post.content && (
        <p className="px-4 pb-3 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* ── Media ── */}
      {post.mediaUrl && (
        <div className="border-y border-gray-100 dark:border-gray-700">
          {post.mediaType === 'video'
            ? <video src={post.mediaUrl} controls className="w-full max-h-[480px] bg-black" />
            : <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[480px] object-cover" />}
        </div>
      )}

      {/* ── Engagement counts ── */}
      {(post.likes?.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-4 py-2">
          {post.likes?.length > 0 ? (
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
              <span className="w-[18px] h-[18px] bg-green-500 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: 10 }}>♥</span>
              {post.likes.length}
            </div>
          ) : <span />}
          {comments.length > 0 && (
            <button onClick={openComment} className="text-[13px] text-gray-500 dark:text-gray-400 hover:underline">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="border-t border-gray-100 dark:border-gray-700" />
      <div className="flex items-center px-2 py-0.5">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
            liked
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {liked
            ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          Like
        </button>
        <button
          onClick={openComment}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Comment
        </button>
      </div>

      {/* ── Comments section ── */}
      {(comments.length > 0 || showInput) && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2.5">

          {/* Load previous comments */}
          {hidden > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              View {hidden} previous comment{hidden !== 1 ? 's' : ''}
            </button>
          )}

          {/* Comment list */}
          {visible.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar src={c.user?.avatar} name={c.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 dark:bg-gray-700/70 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                  <span className="font-semibold text-[13px] text-gray-900 dark:text-white mr-1.5">{c.user?.name || 'Unknown'}</span>
                  <span className="text-[14px] text-gray-700 dark:text-gray-200 break-words">{c.text}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 ml-2">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}

          {/* Collapse */}
          {showAll && hidden > 0 && (
            <button
              onClick={() => setShowAll(false)}
              className="text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              Show less
            </button>
          )}

          {/* Comment input */}
          {showInput && (
            <form onSubmit={handleComment} className="flex items-center gap-2 pt-0.5">
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
              <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 gap-2 focus-within:ring-2 focus-within:ring-green-400/40 transition">
                <input
                  ref={inputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-[14px] text-gray-800 dark:text-gray-200 outline-none placeholder-gray-400"
                  disabled={posting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || posting}
                  className="text-green-500 hover:text-green-600 disabled:opacity-30 transition flex-shrink-0"
                >
                  {posting
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// ─── SocialPage ───────────────────────────────────────────────────────────────

const SocialPage = () => {
  const [theme, setTheme] = useState("light");
  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.warn('⚠️ Token expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      const d = await res.json();
      if (d.success) setPosts(d.posts);
    } catch (e) { console.error('❌ Failed to fetch posts:', e.message); }
    finally { setLoading(false); }
  };

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) { alert('Image or video only'); return; }
    if (f.size > 10 * 1024 * 1024) { alert('File size must be under 10 MB'); return; }
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
    setMediaUrl('');
  };

  const handleCreatePost = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!postContent.trim() && !mediaFile && !mediaUrl) return;
    setUploading(true);
    try {
      let finalUrl = mediaUrl, mediaType = null;
      if (mediaFile) {
        const r = await uploadToCloudinary(mediaFile);
        finalUrl = r.url; mediaType = r.type;
      } else if (mediaUrl) {
        mediaType = mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
      }
      const tk = token || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
        body: JSON.stringify({ content: postContent, mediaUrl: finalUrl, mediaType }),
      });
      const d = await res.json();
      if (d.success) {
        setPosts(prev => [d.post, ...prev]);
        setPostContent(''); setMediaFile(null); setMediaPreview(null); setMediaUrl('');
      } else { alert(d.message); }
    } catch (e) { console.error(e); alert('Failed to create post'); }
    finally { setUploading(false); }
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-[680px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow">
                <span className="text-white text-lg leading-none">🌱</span>
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">AgriSense</p>
                <p className="text-[11px] text-gray-400 leading-none mt-0.5">Community Feed</p>
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar src={user.avatar} name={user.name} size="md" />
                <p className="hidden sm:block text-[13px] font-semibold text-gray-800 dark:text-white">{user.name}</p>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-[12px] px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-[13px] font-semibold rounded-lg transition shadow-sm"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </header>

        <main className="max-w-[680px] mx-auto px-3 py-4 space-y-3">

          {/* ── Create Post ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <Avatar src={user?.avatar} name={user?.name || '?'} size="md" />
              <div className="flex-1">
                {user ? (
                  <textarea
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder="What's on your mind? Share your farming update..."
                    rows={2}
                    className="w-full bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5 text-[15px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none resize-none focus:ring-2 focus:ring-green-400/30 transition"
                  />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl px-4 py-2.5 text-[14px] text-gray-400 transition"
                  >
                    What's on your mind?
                  </button>
                )}

                {/* Media preview */}
                {mediaPreview && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    {mediaFile?.type.startsWith('video')
                      ? <video src={mediaPreview} controls className="w-full max-h-52" />
                      : <img src={mediaPreview} alt="Preview" className="w-full max-h-52 object-cover" />}
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {/* URL input */}
                {user && !mediaFile && (
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={e => setMediaUrl(e.target.value)}
                    placeholder="Or paste image / video URL..."
                    className="w-full mt-2 px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-400/30 transition"
                  />
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-gray-500 dark:text-gray-400 transition ${user ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photo / Video
                    <input type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={!user} className="hidden" />
                  </label>
                  <button
                    onClick={handleCreatePost}
                    disabled={!user || uploading || (!postContent.trim() && !mediaFile && !mediaUrl)}
                    className="px-5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg transition shadow-sm"
                  >
                    {uploading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Feed ── */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-[14px] text-gray-500 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center shadow-sm">
              <p className="text-5xl mb-3">🌾</p>
              <p className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">No posts yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Be the first to share something with the community!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                token={token}
                posts={posts}
                onPostsUpdate={setPosts}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            ))
          )}
        </main>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
};

export default SocialPage;