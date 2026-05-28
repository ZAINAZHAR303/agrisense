"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthModal from "@/components/AuthModal";
import { uploadToCloudinary } from "@/utils/cloudinary";

const API_URL = "https://agrisence-backend.onrender.com/api";
const COMMENTS_PREVIEW = 2;

// ─── Claymorphism Avatar with Status Indicator ─────────────────────────────
const Avatar = ({
  src,
  name,
  size = "md",
  isOnline = false,
  className = "",
}) => {
  const sz = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
    "2xl": "w-16 h-16",
  }[size];

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={`${sz} rounded-[20px] overflow-hidden bg-clay-surface shadow-clay-sm transition-all duration-300 hover:shadow-clay-md hover:scale-105`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            src ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=10b981&color=fff&bold=true&size=128`
          }
          alt={name || "User"}
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full shadow-clay-sm ring-2 ring-white dark:ring-slate-800"></span>
      )}
    </div>
  );
};

// ─── Enhanced Time Ago with Precise Formatting ─────────────────────────────
const timeAgo = (date) => {
  if (!date) return "";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

// ─── Claymorphism Like Button with Press Effect ───────────────────────────
const LikeButton = ({ liked, count, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[20px] text-[14px] font-semibold transition-all duration-200 ${
        liked
          ? "text-rose-500 bg-clay-rose shadow-clay-inset"
          : "text-slate-600 dark:text-slate-400 bg-clay-surface shadow-clay-sm hover:shadow-clay-md active:shadow-clay-inset active:scale-95"
      } ${isPressed ? "scale-95" : ""}`}
    >
      <div className={`relative transition-transform duration-200 ${liked ? "animate-heartBeat" : ""}`}>
        {liked ? (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </div>
      <span>
        {liked ? "Liked" : "Like"}
        {count > 0 && ` • ${count.toLocaleString()}`}
      </span>
    </button>
  );
};

// ─── Comment Toggle Button with Claymorphism ──────────────────────────────
const CommentToggle = ({ count, isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[20px] text-[14px] font-semibold transition-all duration-300 ${
        isOpen
          ? "text-emerald-600 bg-clay-emerald shadow-clay-inset"
          : "text-slate-600 dark:text-slate-400 bg-clay-surface shadow-clay-sm hover:shadow-clay-md active:shadow-clay-inset"
      }`}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span>
        {count > 0 ? `${count.toLocaleString()} Comments` : "Add Comment"}
      </span>
    </button>
  );
};

// ─── Share Button with Tooltip ────────────────────────────────────────────
const ShareButton = ({ onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    onClick();
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[20px] text-[14px] font-semibold text-slate-600 dark:text-slate-400 bg-clay-surface shadow-clay-sm hover:shadow-clay-md active:shadow-clay-inset transition-all duration-200"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </button>
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap animate-fadeInUp shadow-clay-lg">
          Link copied!
        </div>
      )}
    </div>
  );
};

// ─── Claymorphism Comment Component ───────────────────────────────────────
const CommentItem = ({ comment, user, onReply, depth = 0 }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(comment.replies || []);

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    const newReply = {
      id: Date.now(),
      text: replyText,
      user: user,
      createdAt: new Date().toISOString(),
    };
    setReplies([...replies, newReply]);
    setReplyText("");
    setShowReply(false);
    onReply?.(comment.id, newReply);
  };

  return (
    <div className={`flex items-start gap-3 ${depth > 0 ? "ml-8 mt-3" : ""} animate-slideIn`}>
      <Avatar src={comment.user?.avatar} name={comment.user?.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-clay-surface rounded-[20px] rounded-tl-md px-4 py-2.5 shadow-clay-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[13px] text-slate-900 dark:text-slate-100">
              {comment.user?.name || "Unknown"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <span className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed break-words">
            {comment.text}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors"
          >
            Reply
          </button>
          {comment.likes > 0 && (
            <span className="text-[11px] text-slate-400">
              {comment.likes} likes
            </span>
          )}
        </div>

        {showReply && user && (
          <div className="mt-2 animate-slideDown">
            <div className="flex gap-2">
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
              <div className="flex-1">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 text-[13px] rounded-[20px] border-0 bg-clay-surface shadow-clay-inset focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  onKeyPress={(e) => e.key === "Enter" && handleReplySubmit()}
                />
              </div>
            </div>
          </div>
        )}

        {replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            user={user}
            onReply={onReply}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Claymorphism Post Card with Hidden Comments ──────────────────────────
const PostCard = ({
  post,
  user,
  token,
  posts,
  onPostsUpdate,
  onAuthRequired,
}) => {
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setIsOnline(Math.random() > 0.7);
  }, []);

  const comments = post.comments || [];
  const liked = user && post.likes?.some((l) => l.userId === user.id);
  const tok = () => token || localStorage.getItem("token");

  const MAX_CHARS = 280;
  const shouldTruncate = post.content && post.content.length > MAX_CHARS;
  const displayContent = isExpanded
    ? post.content
    : shouldTruncate
      ? post.content.slice(0, MAX_CHARS) + "..."
      : post.content;

  const openCommentInput = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setIsCommentsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleLike = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/posts/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ postId: post.id }),
      });
      const d = await res.json();
      if (d.success)
        onPostsUpdate(
          posts.map((p) =>
            p.id !== post.id
              ? p
              : {
                  ...p,
                  likes: d.liked
                    ? [...(p.likes || []), { userId: user.id }]
                    : (p.likes || []).filter((l) => l.userId !== user.id),
                },
          ),
        );
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/posts/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ postId: post.id, text: commentText }),
      });
      const d = await res.json();
      if (d.success) {
        onPostsUpdate(
          posts.map((p) =>
            p.id !== post.id
              ? p
              : {
                  ...p,
                  comments: [...(p.comments || []), d.comment],
                },
          ),
        );
        setCommentText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await res.json();
      if (d.success) onPostsUpdate(posts.filter((p) => p.id !== post.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  };

  return (
    <article
      className="group bg-clay-surface rounded-[32px] shadow-clay-lg hover:shadow-clay-xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.user?.avatar}
            name={post.user?.name}
            size="lg"
            isOnline={isOnline}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-tight hover:text-emerald-600 cursor-pointer transition-colors">
                {post.user?.name || "Unknown"}
              </span>
              {post.user?.verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{timeAgo(post.createdAt)}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Public
              </span>
            </div>
          </div>
        </div>

        {user?.id === post.userId && (
          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[20px] transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Delete post"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {post.content && (
        <div className="px-6 pb-3">
          <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[14px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* ── Media ── */}
      {post.mediaUrl && (
        <div className="relative overflow-hidden mx-4 rounded-[24px] shadow-clay-sm">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-[500px] object-contain"
              poster={post.mediaUrl.replace(/\.(mp4|webm|ogg)$/i, ".jpg")}
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post content"
              className="w-full max-h-[500px] object-cover transform transition-all duration-700 group-hover:scale-105"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* ── Engagement Stats ── */}
      {(post.likes?.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/50 dark:border-slate-700/50 mx-4">
          {post.likes?.length > 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-[10px] shadow-clay-sm">
                  ♥
                </div>
              </div>
              <span className="font-medium">
                {post.likes.length.toLocaleString()} like
                {post.likes.length !== 1 ? "s" : ""}
              </span>
            </div>
          ) : (
            <span />
          )}
          {comments.length > 0 && !isCommentsOpen && (
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="text-[13px] font-medium text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {comments.length.toLocaleString()} comment
              {comments.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* ── Action Buttons (Always Visible) ── */}
      <div className="flex items-center gap-2 p-4">
        <LikeButton
          liked={liked}
          count={post.likes?.length || 0}
          onClick={handleLike}
        />
        <CommentToggle
          count={comments.length}
          isOpen={isCommentsOpen}
          onClick={() => {
            if (!user && comments.length === 0) {
              onAuthRequired();
              return;
            }
            setIsCommentsOpen(!isCommentsOpen);
          }}
        />
        <ShareButton onClick={handleShare} />
      </div>

      {/* ── Comments Section (Hidden until opened) ── */}
      {isCommentsOpen && (
        <div className="px-4 pb-6 pt-2 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-slate-800/50 dark:to-slate-800/30 border-t border-slate-200/50 dark:border-slate-700/50 animate-slideDown">
          {/* Comment List */}
          {comments.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar mb-4">
              {comments.map((c, idx) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  user={user}
                  onReply={(commentId, reply) => {
                    // Handle reply functionality
                  }}
                />
              ))}
            </div>
          )}

          {/* Comment Input */}
          {user ? (
            <form onSubmit={handleComment} className="flex items-start gap-3 mt-4">
              <Avatar src={user?.avatar} name={user?.name} size="sm" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="relative flex items-center bg-clay-surface rounded-[20px] shadow-clay-inset overflow-hidden">
                  <input
                    ref={inputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={comments.length > 0 ? "Write a comment..." : "Be the first to comment..."}
                    className="flex-1 bg-transparent px-4 py-2.5 text-[14px] text-slate-800 dark:text-slate-200 outline-none placeholder-slate-400"
                    disabled={posting}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || posting}
                    className="p-2 mr-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30 rounded-[20px] transition-all duration-200"
                  >
                    {posting ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <button
                onClick={() => onAuthRequired()}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in to join the conversation
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

// ─── Main SocialPage Component with Claymorphism ──────────────────────────
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
  const [isDragging, setIsDragging] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemDark ? "dark" : "light");
    setTheme(initialTheme);

    // Apply theme to document
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    fetchPosts();
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail?.theme || localStorage.getItem("theme");
      if (newTheme) {
        setTheme(newTheme);
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    window.addEventListener("themeChange", handleThemeChange);
    
    // Also listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        const newTheme = e.newValue;
        if (newTheme) {
          setTheme(newTheme);
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("themeChange", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      const d = await res.json();
      if (d.success) setPosts(d.posts);
    } catch (e) {
      console.error("Failed to fetch posts:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    validateAndSetFile(f);
  };

  const validateAndSetFile = (f) => {
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      alert("Please upload an image or video file only");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      alert("File size must be under 50 MB");
      return;
    }
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
    setMediaUrl("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleCreatePost = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!postContent.trim() && !mediaFile && !mediaUrl) return;

    setUploading(true);
    try {
      let finalUrl = mediaUrl,
        mediaType = null;
      if (mediaFile) {
        const r = await uploadToCloudinary(mediaFile);
        finalUrl = r.url;
        mediaType = r.type;
      } else if (mediaUrl) {
        mediaType = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)
          ? "video"
          : "image";
      }

      const tk = token || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tk}`,
        },
        body: JSON.stringify({
          content: postContent,
          mediaUrl: finalUrl,
          mediaType,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPosts((prev) => [d.post, ...prev]);
        setPostContent("");
        setCharCount(0);
        setMediaFile(null);
        setMediaPreview(null);
        setMediaUrl("");
      } else {
        alert(d.message);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    setPostContent(value);
    setCharCount(value.length);
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText =
      postContent.substring(0, start) + emoji + postContent.substring(end);
    setPostContent(newText);
    setCharCount(newText.length);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`${theme === "dark" ? "dark" : ""} min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300`}
    >
      <main className="max-w-[680px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20">
        {/* ── Claymorphism Create Post Card ── */}
        <div className="bg-clay-surface rounded-[32px] shadow-clay-xl hover:shadow-clay-2xl transition-all duration-300 overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Avatar
                src={user?.avatar}
                name={user?.name || "Guest"}
                size="md"
              />
              <div className="flex-1">
                {user ? (
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={postContent}
                      onChange={handleContentChange}
                      placeholder="What's happening in your farm? Share an update..."
                      rows={3}
                      maxLength={500}
                      className="w-full bg-clay-surface rounded-[24px] px-4 py-3 text-[15px] text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none resize-none shadow-clay-inset focus:shadow-clay-md transition-all duration-200"
                    />
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-clay-surface rounded-[24px] shadow-clay-lg p-2 z-10 animate-scaleIn">
                        <div className="grid grid-cols-6 gap-1">
                          {[
                            "😊",
                            "😂",
                            "❤️",
                            "👍",
                            "🌾",
                            "🚜",
                            "🌱",
                            "🐄",
                            "🌽",
                            "🍅",
                            "🥕",
                            "🐔",
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => insertEmoji(emoji)}
                              className="text-xl hover:bg-emerald-50 dark:hover:bg-slate-700 p-1 rounded-[12px] transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full text-left bg-clay-surface rounded-[24px] px-4 py-3 text-[15px] text-slate-500 dark:text-slate-400 shadow-clay-inset hover:shadow-clay-md transition-all duration-200"
                  >
                    What's happening in your farm? Share an update...
                  </button>
                )}
              </div>
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative mt-4 rounded-[24px] overflow-hidden shadow-clay-sm group animate-scaleIn">
                {mediaFile?.type.startsWith("video") ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-64 bg-slate-900"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover"
                  />
                )}
                <button
                  onClick={clearMedia}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* URL Input */}
            {user && !mediaFile && (
              <div className="mt-3">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste image or video URL..."
                  className="w-full px-4 py-2.5 text-[13px] rounded-[20px] border-0 bg-clay-surface shadow-clay-inset text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:shadow-clay-md transition-all duration-200"
                />
              </div>
            )}

            {/* Drag & Drop Zone */}
            {user && !mediaPreview && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-3 border-2 border-dashed rounded-[24px] p-4 sm:p-6 text-center transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-clay-lg scale-105"
                    : "border-emerald-300 dark:border-slate-600 bg-clay-surface shadow-clay-sm hover:shadow-clay-md"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-10 h-10 mx-auto mb-2 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  {isDragging
                    ? "Drop your file here"
                    : "Drag & drop or click to upload"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Images or videos up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-slate-800/50 dark:to-slate-800/30 border-t border-emerald-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-1">
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-[20px] text-[13px] font-medium transition-all duration-200 ${
                  user
                    ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer hover:scale-105"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Media
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={!user}
                  className="hidden"
                />
              </label>

              {user && (
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[20px] text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-105"
                >
                  😊 Emoji
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${charCount > 450 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
                />
                <span
                  className={`text-[12px] font-mono ${charCount > 500 ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`}
                >
                  {charCount}/500
                </span>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={
                  !user ||
                  uploading ||
                  (!postContent.trim() && !mediaFile && !mediaUrl)
                }
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-[24px] transition-all duration-200 shadow-clay-md hover:shadow-clay-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Posting...
                  </span>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Feed ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-900/30 border-t-emerald-500 animate-spin" />
              <div
                className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-300/30 animate-spin"
                style={{ animationDuration: "1.5s" }}
              />
            </div>
            <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 animate-pulse">
              Loading community posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-clay-surface rounded-[32px] shadow-clay-xl py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-[32px] flex items-center justify-center animate-bounce shadow-clay-lg">
              <span className="text-4xl">🌾</span>
            </div>
            <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 mb-2">
              No posts yet
            </h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Be the first to share your farming journey with the community!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PostCard
                  post={post}
                  user={user}
                  token={token}
                  posts={posts}
                  onPostsUpdate={setPosts}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {user && (
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={handleLogout}
            className="p-3 rounded-full bg-clay-surface text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all duration-300 shadow-clay-md hover:shadow-clay-lg hover:scale-110 active:scale-95"
            aria-label="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Claymorphism Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes heartBeat {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .animate-heartBeat {
          animation: heartBeat 0.3s ease-in-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default SocialPage;