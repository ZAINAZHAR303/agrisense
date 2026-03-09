const express = require('express');
const { getDB } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get soil data for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDB();

    const soilData = await db
      .collection('soilData')
      .find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .toArray();

    res.json({
      success: true,
      data: soilData,
    });
  } catch (error) {
    console.error('Get soil data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch soil data',
    });
  }
});

// Add new soil data
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nitrogen, phosphorus, potassium, ph, moisture, temperature } = req.body;

    if (nitrogen === undefined || phosphorus === undefined || potassium === undefined) {
      return res.status(400).json({
        success: false,
        message: 'N, P, K values are required',
      });
    }

    const db = getDB();

    const newSoilData = {
      userId: req.user.userId,
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      ph: ph ? parseFloat(ph) : null,
      moisture: moisture ? parseFloat(moisture) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      timestamp: new Date(),
    };

    const result = await db.collection('soilData').insertOne(newSoilData);

    res.status(201).json({
      success: true,
      message: 'Soil data added successfully',
      data: {
        ...newSoilData,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Add soil data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add soil data',
    });
  }
});

module.exports = router;
