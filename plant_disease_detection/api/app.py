"""
FastAPI Application for Plant Disease Detection
Provides RESTful API endpoints for disease detection
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path
from PIL import Image
import io
import numpy as np

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from src.inference import DiseasePredictor
import config

# Initialize FastAPI app
app = FastAPI(
    title="AgriSense AI - Plant Disease Detection API",
    description="AI-powered plant disease detection system using transfer learning with EfficientNetB0",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize disease predictor (loaded once at startup)
predictor = None


# Pydantic models for request/response
class PredictionResponse(BaseModel):
    """Response model for disease prediction"""
    success: bool
    message: str
    data: Optional[dict] = None


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    message: str
    model_loaded: bool
    num_classes: int


@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    global predictor
    try:
        print("🚀 Initializing Plant Disease Detection Model...")
        predictor = DiseasePredictor()
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "AgriSense AI - Plant Disease Detection API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "classes": "/classes",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running",
        "model_loaded": predictor is not None,
        "num_classes": len(predictor.class_names) if predictor else 0
    }


@app.get("/classes", response_model=dict)
async def get_classes():
    """Get all disease classes"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "success": True,
        "num_classes": len(predictor.class_names),
        "classes": predictor.class_names
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    top_k: int = 3
):
    """
    Predict plant disease from uploaded image
    
    Args:
        file: Image file (JPEG, PNG)
        top_k: Number of top predictions to return (default: 3)
    
    Returns:
        Prediction results with disease information
    """
    # Validate model is loaded
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Please upload an image."
        )
    
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Get prediction
        result = predictor.predict(image, top_k=top_k)
        
        # Format response
        response_data = {
            "filename": file.filename,
            "top_prediction": {
                "disease": result['top_prediction']['disease'],
                "confidence": result['top_prediction']['confidence'],
                "confidence_percent": result['top_prediction']['confidence_percent']
            },
            "all_predictions": result['predictions'],
            "disease_info": result['disease_info']
        }
        
        return {
            "success": True,
            "message": "Prediction successful",
            "data": response_data
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


@app.post("/predict/batch", response_model=PredictionResponse)
async def predict_batch(
    files: List[UploadFile] = File(...),
    top_k: int = 3
):
    
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images allowed per batch"
        )
    
    results = []
    
    for file in files:
        try:
            # Read and process image
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            
            # Get prediction
            result = predictor.predict(image, top_k=top_k)
            
            results.append({
                "filename": file.filename,
                "success": True,
                "prediction": result['top_prediction'],
                "all_predictions": result['predictions']
            })
        
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "message": f"Processed {len(files)} images",
        "data": {
            "total_images": len(files),
            "results": results
        }
    }


@app.get("/disease-info/{disease_name}", response_model=dict)
async def get_disease_info(disease_name: str):
    """
    Get detailed information about a specific disease
    
    Args:
        disease_name: Name of the disease
    
    Returns:
        Disease information
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate disease name
    if disease_name not in predictor.class_names:
        raise HTTPException(
            status_code=404,
            detail=f"Disease '{disease_name}' not found. Available classes: {predictor.class_names}"
        )
    
    disease_info = predictor._get_disease_info(disease_name)
    
    return {
        "success": True,
        "disease": disease_name,
        "info": disease_info
    }


if __name__ == "__main__":
    import uvicorn
    
    print("="*80)
    print("🌱 AgriSense AI - Plant Disease Detection API")
    print("="*80)
    print("\n📡 Starting server...")
    print("  - API: http://localhost:8000")
    print("  - Docs: http://localhost:8000/docs")
    print("  - ReDoc: http://localhost:8000/redoc")
    print("\n⏹️  Press Ctrl+C to stop\n")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
