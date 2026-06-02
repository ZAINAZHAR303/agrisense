const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { getDB } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all posts (with pagination)
router.get('/', async (req, res) => {
  try {
    const db = getDB();

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const total = await db.collection('posts').countDocuments();
    const posts = await db
      .collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Collect all user IDs safely
    const userIds = new Set();
    posts.forEach(post => {
      if (post.userId) userIds.add(post.userId);
      post.likes?.forEach(like => like.userId && userIds.add(like.userId));
      post.comments?.forEach(comment => comment.userId && userIds.add(comment.userId));
    });

    // Only valid ObjectIds
    const validUserIds = Array.from(userIds)
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const users = await db
      .collection('users')
      .find({ _id: { $in: validUserIds } })
      .toArray();

    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        name: user.name,
        avatar: user.avatar,
      };
    });

    // Clean + enrich posts
    const enrichedPosts = posts.map(post => {
      const { _id, ...rest } = post;
      return {
        ...rest,
        id: _id.toString(),
        user: userMap[post.userId] || { name: 'Unknown User', avatar: '' },
        likes: post.likes || [],
        comments: (post.comments || []).map(comment => ({
          ...comment,
          user: userMap[comment.userId] || { name: 'Unknown User', avatar: '' },
        })),
      };
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });

  } catch (error) {
    console.error('💥 Get posts error:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
});


// Create new post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post content or media is required',
      });
    }

    const db = getDB();

    const newPost = {
      userId: req.user.userId,
      content: content || '',
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      likes: [],
      comments: [],
      createdAt: new Date(),
    };

    const result = await db.collection('posts').insertOne(newPost);

    // Get user details
    const userDetails = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        ...newPost,
        id: result.insertedId.toString(),
        user: {
          name: userDetails.name,
          avatar: userDetails.avatar,
        },
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    });
  }
});

// Delete a post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDB();

    // Check if post exists and belongs to user
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
});

// Like/Unlike a post
router.post('/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required',
      });
    }

    const db = getDB();

    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likes = post.likes || [];
    const userLikeIndex = likes.findIndex(like => like.userId === req.user.userId);

    if (userLikeIndex > -1) {
      // Unlike
      likes.splice(userLikeIndex, 1);
    } else {
      // Like
      likes.push({
        userId: req.user.userId,
        createdAt: new Date(),
      });
    }

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $set: { likes } }
    );

    res.json({
      success: true,
      liked: userLikeIndex === -1,
      likesCount: likes.length,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
    });
  }
});

// Add comment to a post
router.post('/comment', authMiddleware, async (req, res) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment text are required',
      });
    }

    const db = getDB();

    const newComment = {
      id: new ObjectId().toString(),
      userId: req.user.userId,
      text,
      createdAt: new Date(),
    };

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: newComment } }
    );

    // Get user details
    const userDetails = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        ...newComment,
        user: {
          name: userDetails.name,
          avatar: userDetails.avatar,
        },
      },
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
});

module.exports = router;
