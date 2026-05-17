const express = require('express');
const mongoose = require('mongoose');
const { getDB } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const serializeSession = (session) => {
  const { _id, ...rest } = session;
  return {
    ...rest,
    id: _id.toString(),
  };
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
      });
    }
    const sessions = await db
      .collection('chatSessions')
      .find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .project({ messages: { $slice: -2 } })
      .toArray();

    res.json({
      success: true,
      sessions: sessions.map(serializeSession),
    });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions',
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
      });
    }
    const session = await db.collection('chatSessions').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      userId: req.user.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    res.json({
      success: true,
      session: serializeSession(session),
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session',
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, title, language, messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages are required',
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
      });
    }
    const now = new Date();
    const cleanMessages = messages.map((message) => ({
      sender: message.sender,
      text: message.text,
      language: message.language || language || 'ur',
      sources: message.sources || [],
      createdAt: message.createdAt ? new Date(message.createdAt) : now,
    }));

    if (sessionId) {
      const result = await db.collection('chatSessions').findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(sessionId),
          userId: req.user.userId,
        },
        {
          $set: {
            title: title || cleanMessages.find((m) => m.sender === 'user')?.text?.slice(0, 80) || 'AgriSense chat',
            language: language || 'ur',
            messages: cleanMessages,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found',
        });
      }

      return res.json({
        success: true,
        session: serializeSession(result.value),
      });
    }

    const newSession = {
      userId: req.user.userId,
      title: title || cleanMessages.find((m) => m.sender === 'user')?.text?.slice(0, 80) || 'AgriSense chat',
      language: language || 'ur',
      messages: cleanMessages,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('chatSessions').insertOne(newSession);

    res.status(201).json({
      success: true,
      session: {
        ...newSession,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Save chat session error:', error.message);
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to save chat session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
      });
    }
    await db.collection('chatSessions').deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      userId: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Chat session deleted',
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
    });
  }
});

module.exports = router;
