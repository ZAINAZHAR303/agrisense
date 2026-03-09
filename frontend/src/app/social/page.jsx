"use client";

import React, { useState, useEffect } from "react";

// Placeholder avatars (using initial letters as fallback)
const getAvatarInitial = (name) => {
  return name.split(" ")[1]?.[0] || name[0];
};

const samplePosts = [
  {
    id: 1,
    user: "Farmer Ali",
    avatar: "https://static.vecteezy.com/system/resources/previews/001/993/889/non_2x/beautiful-latin-woman-avatar-character-icon-free-vector.jpg",
    time: "2 hours ago",
    content: "Planted tomatoes today. Can't wait to see them grow!",
    likes: 12,
    comments: 4,
    liked: false,
    commentsList: [
      { id: 1, user: "Farmer Bob", text: "Great! What variety did you plant?", time: "1 hour ago" },
      { id: 2, user: "Farmer Sara", text: "Remember to water them regularly!", time: "30 mins ago" },
    ],
  },
  {
    id: 2,
    user: "Farmer Sara",
    avatar: "https://static.vecteezy.com/system/resources/previews/002/002/332/non_2x/ablack-man-avatar-character-isolated-icon-free-vector.jpg",
    time: "5 hours ago",
    content: "Using the AgriSense AI recommendations for soil nutrients. Early results are promising!",
    likes: 20,
    comments: 6,
    liked: true,
    commentsList: [
      { id: 1, user: "Farmer Ali", text: "That's amazing! How accurate are the recommendations?", time: "3 hours ago" },
      { id: 2, user: "AgriSense Team", text: "Great to hear! Our AI model has 94% accuracy for soil analysis.", time: "2 hours ago" },
    ],
  },
  {
    id: 3,
    user: "Farmer Hamid",
    avatar: "https://static.vecteezy.com/system/resources/previews/002/002/403/non_2x/man-with-beard-avatar-character-isolated-icon-free-vector.jpg",
    time: "1 day ago",
    content: "Anyone facing pest issues in peppers? Need advice.",
    likes: 15,
    comments: 3,
    liked: false,
    commentsList: [
      { id: 1, user: "Farmer John", text: "Try neem oil spray. Works well for me!", time: "20 hours ago" },
      { id: 2, user: "Farmer Maria", text: "Check for aphids. Use ladybugs as natural predators.", time: "18 hours ago" },
    ],
  },
];

const CommentPopup = ({ post, onClose, onAddComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(post.id, newComment);
      setNewComment("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Comments ({post.comments})
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center mt-4 space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="font-semibold text-green-600 dark:text-green-300">
                {getAvatarInitial(post.user)}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-100">{post.user}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{post.time}</p>
            </div>
          </div>
          <p className="mt-3 text-gray-700 dark:text-gray-200">{post.content}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {post.commentsList?.map((comment) => (
            <div key={comment.id} className="mb-4 last:mb-0">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                    {getAvatarInitial(comment.user)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-3">
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium text-gray-800 dark:text-gray-100">{comment.user}</h5>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
                    </div>
                    <p className="mt-1 text-gray-700 dark:text-gray-200">{comment.text}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-xl shadow transition"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SocialPage = () => {
  const [theme, setTheme] = useState("light");
  const [posts, setPosts] = useState(samplePosts);
  const [postContent, setPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId, commentText) => {
    const newComment = {
      id: Date.now(),
      user: "You",
      text: commentText,
      time: "Just now"
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...post.commentsList, newComment]
        };
      }
      return post;
    }));
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) return;

    const newPost = {
      id: posts.length + 1,
      user: "You",
      avatar: "",
      time: "Just now",
      content: postContent,
      likes: 0,
      comments: 0,
      liked: false,
      commentsList: []
    };

    setPosts([newPost, ...posts]);
    setPostContent("");
  };

  return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-green-50 dark:from-gray-900 dark:to-green-950 transition-colors duration-500">
        {/* Header */}
        <header className="bg-linear-to-r from-green-500 to-green-700 dark:from-green-800 dark:to-green-900 text-white p-6 shadow-lg rounded-b-3xl">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">AgriSense Community</h1>
                <p className="mt-2 text-md opacity-90">Connect with farmers and share your updates</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
          {/* Post Creation */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Share an update
            </h2>
            <div className="flex space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <span className="font-semibold text-green-600 dark:text-green-300">Y</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition resize-none"
                  rows={3}
                  placeholder="What's on your mind? Share your farming experiences..."
                />
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim()}
                    className="px-8 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Community Feed */}
          <section className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                      {/* {getAvatarInitial(post.user)} */}
                      <img src={post.avatar} width={56} height={56} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {post.user}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {post.time}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-4 text-gray-700 dark:text-gray-200 leading-relaxed">{post.content}</p>
                <div className="mt-6 flex items-center space-x-6 text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition ${post.liked ? 'text-green-500' : 'hover:text-green-500'}`}
                  >
                    {post.liked ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    <span className="font-medium">{post.likes}</span>
                  </button>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center space-x-2 hover:text-blue-500 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">{post.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-purple-500 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="font-medium">Share</span>
                  </button>
                </div>
              </div>
            ))}
          </section>
        </main>

        {/* Comment Popup */}
        {selectedPost && (
          <CommentPopup
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAddComment={handleAddComment}
          />
        )}

        {/* Floating Action Button */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
  );
};

export default SocialPage;