# Disease Detection Backend Integration

This document explains how the frontend integrates with the FastAPI backend for disease detection.

## Architecture

The disease detection feature uses a FastAPI backend with a trained EfficientNetB0 model to analyze plant leaf images and detect diseases.

### Backend API

**Base URL**: `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`)

**Main Endpoint**: `POST /predict`

#### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file`: Image file (JPEG/PNG)
  - `top_k`: Number of top predictions (default: 3)

#### Response
```json
{
  "success": true,
  "message": "Prediction successful",
  "data": {
    "filename": "leaf.jpg",
    "top_prediction": {
      "disease": "Tomato_Early_blight",
      "confidence": 0.92,
      "confidence_percent": "92.0%"
    },
    "all_predictions": [
      {
        "disease": "Tomato_Early_blight",
        "confidence": 0.92,
        "confidence_percent": "92.0%"
      },
      // ... more predictions
    ],
    "disease_info": {
      "description": "Disease description",
      "symptoms": ["symptom1", "symptom2"],
      "treatment": ["treatment1", "treatment2"],
      "prevention": ["prevention1", "prevention2"]
    }
  }
}
```

## Frontend Implementation

### Files Structure

```
frontend/src/
├── utils/
│   └── api.js                          # API utility functions
├── features/
│   └── disease-detection/
│       ├── DiseaseDetectionContent.jsx # Main component with state
│       └── components/
│           ├── ImageUpload.jsx         # Image upload & API call
│           ├── ResultDisplay.jsx       # Real results display
│           └── ResultPreview.jsx       # Sample results (demo)
```

### Key Components

#### 1. API Utilities (`utils/api.js`)

Provides functions to interact with the backend:
- `predictDisease(imageFile, topK)` - Send image for analysis
- `getDiseaseInfo(diseaseName)` - Get disease details
- `getDiseaseClasses()` - Get all available classes
- `checkAPIHealth()` - Check API status

#### 2. ImageUploadSection (`components/ImageUpload.jsx`)

Handles image upload and disease analysis:
- Validates file type and size
- Calls `predictDisease()` API function
- Passes results to parent component
- Shows loading states and errors

#### 3. ResultDisplay (`components/ResultDisplay.jsx`)

Displays real-time analysis results:
- Top prediction with confidence
- Disease information (symptoms, treatment, prevention)
- Alternative predictions with confidence bars

#### 4. DiseaseDetectionContent (Main Component)

Manages state and coordinates components:
- Stores analysis results
- Toggles between sample and real results
- Handles result callbacks

## Setup Instructions

### 1. Configure Backend URL

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Start Backend Server

```bash
cd plant_disease_detection/api
python app.py
# Server runs on http://localhost:8000
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Test Integration

1. Navigate to `http://localhost:3000/disease-detection`
2. Upload a plant leaf image
3. Click "Analyze Disease"
4. View real-time results from the AI model

## Error Handling

The integration includes comprehensive error handling:

- **Network Errors**: Shows user-friendly message if backend is unreachable
- **Invalid File Types**: Validates file format before upload
- **API Errors**: Displays specific error messages from backend
- **Loading States**: Shows "Analyzing..." during API calls

## API Status Check

To verify the backend is running, check:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Troubleshooting

### Backend Not Responding
- Ensure backend server is running (`python api/app.py`)
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify no firewall blocking port 8000

### CORS Errors
- Backend has CORS enabled for all origins in development
- For production, update `allow_origins` in `app.py`

### Model Not Loaded
- Check backend console for model loading errors
- Ensure `models/plant_disease_efficientnet.h5` exists
- Verify TensorFlow is properly installed

## Production Considerations

For production deployment:

1. **Update CORS Settings** in `app.py`:
   ```python
   allow_origins=["https://yourdomain.com"]
   ```

2. **Set Production API URL**:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

3. **Add Rate Limiting**: Implement rate limiting on the backend

4. **Image Size Limits**: Configure max file size for uploads

5. **Caching**: Consider caching repeated predictions

6. **Monitoring**: Add logging and monitoring for API calls
