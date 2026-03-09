"""
Inference utilities for Plant Disease Detection
"""
import json
import numpy as np
import tensorflow as tf
from pathlib import Path
from PIL import Image
import cv2
from typing import Dict, Tuple, List
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
import config


class DiseasePredictor:
    """Plant disease prediction class"""
    
    def __init__(self, model_path: Path = None, class_mapping_path: Path = None):
        """
        Initialize the predictor
        
        Args:
            model_path: Path to the trained model (.h5 file)
            class_mapping_path: Path to class mapping JSON
        """
        self.model_path = model_path or config.MODEL_H5_PATH
        self.class_mapping_path = class_mapping_path or config.CLASS_MAPPING_PATH
        
        # Load model and class mapping
        self.model = None
        self.class_mapping = None
        self.class_names = []
        
        self._load_model()
        self._load_class_mapping()
    
    def _load_model(self):
        """Load the trained model"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found at {self.model_path}")
        
        print(f"Loading model from {self.model_path}...")
        self.model = tf.keras.models.load_model(self.model_path)
        print("✓ Model loaded successfully")
    
    def _load_class_mapping(self):
        """Load class mapping"""
        if not self.class_mapping_path.exists():
            raise FileNotFoundError(f"Class mapping not found at {self.class_mapping_path}")
        
        with open(self.class_mapping_path, 'r') as f:
            self.class_mapping = json.load(f)
        
        self.class_names = self.class_mapping['class_names']
        print(f"✓ Loaded {len(self.class_names)} disease classes")
    
    def preprocess_image(self, image_input) -> np.ndarray:
        """
        Preprocess image for model prediction
        
        Args:
            image_input: Can be PIL Image, numpy array, or file path
            
        Returns:
            Preprocessed image array
        """
        pil_image = None
        
        # Convert to PIL Image if needed
        if isinstance(image_input, (str, Path)):
            pil_image = Image.open(image_input).convert('RGB')
        elif isinstance(image_input, np.ndarray):
            pil_image = Image.fromarray(image_input).convert('RGB')
        elif isinstance(image_input, Image.Image):
            pil_image = image_input.convert('RGB')
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
        
        # Resize to model input size
        pil_image = pil_image.resize(config.IMAGE_SIZE)
        
        # Convert to array and normalize
        image_array = np.array(pil_image, dtype=np.float32)
        image_array = image_array / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    
    def predict(self, image_input, top_k: int = 3) -> Dict:
        """
        Predict disease from image
        
        Args:
            image_input: Image to predict (file path, PIL Image, or numpy array)
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary with prediction results
        """
        # Preprocess image
        processed_image = self.preprocess_image(image_input)
        
        # Get prediction
        predictions = self.model.predict(processed_image, verbose=0)[0]
        
        # Get top-k predictions
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        
        results = {
            'predictions': [],
            'top_prediction': None
        }
        
        for idx in top_indices:
            class_name = self.class_names[idx]
            confidence = float(predictions[idx])
            
            prediction_info = {
                'disease': class_name,
                'confidence': confidence,
                'confidence_percent': f"{confidence * 100:.2f}%"
            }
            
            results['predictions'].append(prediction_info)
        
        # Set top prediction
        results['top_prediction'] = results['predictions'][0]
        
        # Add disease info
        results['disease_info'] = self._get_disease_info(results['top_prediction']['disease'])
        
        return results
    
    def _get_disease_info(self, disease_name: str) -> Dict:
        """
        Get information about the disease
        
        Args:
            disease_name: Name of the disease
            
        Returns:
            Dictionary with disease information
        """
        # Disease information database
        disease_db = {
            'Tomato_Bacterial_spot': {
                'scientific_name': 'Xanthomonas spp.',
                'severity': 'High',
                'description': 'Bacterial spot causes dark, greasy spots on leaves and fruit.',
                'symptoms': [
                    'Dark brown spots with yellow halos on leaves',
                    'Raised spots on fruits',
                    'Leaf yellowing and drop'
                ],
                'treatment': [
                    'Use copper-based bactericides',
                    'Remove infected plants',
                    'Avoid overhead watering',
                    'Plant resistant varieties'
                ],
                'prevention': [
                    'Use disease-free seeds',
                    'Practice crop rotation',
                    'Maintain proper spacing for air circulation'
                ]
            },
            'Tomato_Early_blight': {
                'scientific_name': 'Alternaria solani',
                'severity': 'Medium to High',
                'description': 'Early blight is a common fungal disease affecting tomato plants.',
                'symptoms': [
                    'Dark brown spots with concentric rings (target-like)',
                    'Lower leaves affected first',
                    'Leaf yellowing and drop'
                ],
                'treatment': [
                    'Apply fungicides containing chlorothalonil',
                    'Remove affected leaves',
                    'Improve air circulation'
                ],
                'prevention': [
                    'Mulch around plants',
                    'Avoid overhead irrigation',
                    'Practice crop rotation (3-year cycle)'
                ]
            },
            'Tomato_Late_blight': {
                'scientific_name': 'Phytophthora infestans',
                'severity': 'Very High',
                'description': 'Late blight is a devastating disease that can destroy entire crops quickly.',
                'symptoms': [
                    'Water-soaked spots on leaves',
                    'White fuzzy growth on leaf undersides',
                    'Brown lesions on stems and fruit',
                    'Rapid plant collapse'
                ],
                'treatment': [
                    'Apply fungicides immediately (copper or mancozeb)',
                    'Remove and destroy infected plants',
                    'Improve drainage'
                ],
                'prevention': [
                    'Plant resistant varieties',
                    'Ensure good air circulation',
                    'Avoid wetting foliage',
                    'Monitor weather conditions'
                ]
            },
            'Tomato_Leaf_Mold': {
                'scientific_name': 'Passalora fulva',
                'severity': 'Medium',
                'description': 'Leaf mold thrives in humid conditions, especially in greenhouses.',
                'symptoms': [
                    'Pale green to yellow spots on upper leaf surface',
                    'Olive-green to brown fuzzy growth on undersides',
                    'Leaf curling and wilting'
                ],
                'treatment': [
                    'Reduce humidity in greenhouse',
                    'Apply fungicides',
                    'Remove infected leaves'
                ],
                'prevention': [
                    'Improve ventilation',
                    'Reduce humidity below 85%',
                    'Space plants properly',
                    'Plant resistant varieties'
                ]
            },
            'Tomato_Septoria_leaf_spot': {
                'scientific_name': 'Septoria lycopersici',
                'severity': 'Medium',
                'description': 'Septoria leaf spot is a common fungal disease in wet conditions.',
                'symptoms': [
                    'Small circular spots with dark borders and gray centers',
                    'Black fruiting bodies in spot centers',
                    'Lower leaves affected first',
                    'Severe defoliation'
                ],
                'treatment': [
                    'Apply fungicides (chlorothalonil or mancozeb)',
                    'Remove infected leaves',
                    'Mulch to prevent soil splash'
                ],
                'prevention': [
                    'Practice crop rotation',
                    'Avoid overhead watering',
                    'Space plants for air circulation',
                    'Use disease-free transplants'
                ]
            },
            'Tomato_Spider_mites_Two_spotted_spider_mite': {
                'scientific_name': 'Tetranychus urticae',
                'severity': 'Medium to High',
                'description': 'Spider mites are tiny pests that suck plant sap.',
                'symptoms': [
                    'Tiny yellow or white spots on leaves',
                    'Fine webbing on plants',
                    'Leaf bronzing and drop',
                    'Stunted plant growth'
                ],
                'treatment': [
                    'Spray with insecticidal soap or neem oil',
                    'Use miticides if severe',
                    'Increase humidity',
                    'Introduce predatory mites'
                ],
                'prevention': [
                    'Regular monitoring',
                    'Maintain plant health',
                    'Avoid water stress',
                    'Remove heavily infested plants'
                ]
            },
            'Tomato__Target_Spot': {
                'scientific_name': 'Corynespora cassiicola',
                'severity': 'Medium',
                'description': 'Target spot causes characteristic concentric ring lesions.',
                'symptoms': [
                    'Brown spots with concentric rings',
                    'Lesions on leaves, stems, and fruit',
                    'Yellowing and defoliation'
                ],
                'treatment': [
                    'Apply fungicides (azoxystrobin or chlorothalonil)',
                    'Remove infected plant parts',
                    'Improve air circulation'
                ],
                'prevention': [
                    'Practice crop rotation',
                    'Avoid overhead irrigation',
                    'Maintain proper plant spacing',
                    'Use disease-free seeds'
                ]
            },
            'Tomato__Tomato_YellowLeaf__Curl_Virus': {
                'scientific_name': 'Tomato yellow leaf curl virus (TYLCV)',
                'severity': 'Very High',
                'description': 'TYLCV is a devastating viral disease spread by whiteflies.',
                'symptoms': [
                    'Upward leaf curling',
                    'Yellowing of leaf margins',
                    'Stunted growth',
                    'Reduced fruit production'
                ],
                'treatment': [
                    'Remove infected plants immediately',
                    'Control whitefly populations',
                    'No chemical cure available'
                ],
                'prevention': [
                    'Use resistant varieties',
                    'Control whiteflies with insecticides or sticky traps',
                    'Use reflective mulches',
                    'Screen greenhouses',
                    'Remove alternate hosts'
                ]
            },
            'Tomato__Tomato_mosaic_virus': {
                'scientific_name': 'Tomato mosaic virus (ToMV)',
                'severity': 'High',
                'description': 'ToMV causes mosaic patterns and plant deformity.',
                'symptoms': [
                    'Mottled light and dark green mosaic pattern on leaves',
                    'Leaf distortion and curling',
                    'Stunted growth',
                    'Reduced fruit quality'
                ],
                'treatment': [
                    'Remove and destroy infected plants',
                    'Disinfect tools and hands',
                    'No chemical treatment available'
                ],
                'prevention': [
                    'Use virus-free seeds and transplants',
                    'Plant resistant varieties',
                    'Disinfect tools between plants',
                    'Wash hands after handling tobacco products',
                    'Control aphids'
                ]
            },
            'Tomato_healthy': {
                'scientific_name': 'N/A',
                'severity': 'None',
                'description': 'The plant appears healthy with no signs of disease.',
                'symptoms': [
                    'Vibrant green leaves',
                    'No spots or discoloration',
                    'Normal growth pattern'
                ],
                'treatment': [
                    'No treatment needed'
                ],
                'prevention': [
                    'Continue good cultural practices',
                    'Monitor regularly for early disease detection',
                    'Maintain proper nutrition and watering',
                    'Ensure adequate spacing and air circulation'
                ]
            }
        }
        
        return disease_db.get(disease_name, {
            'scientific_name': 'Unknown',
            'severity': 'Unknown',
            'description': 'No information available',
            'symptoms': [],
            'treatment': [],
            'prevention': []
        })


if __name__ == "__main__":
    # Test the predictor
    print("Testing Disease Predictor...")
    
    predictor = DiseasePredictor()
    
    # Test with a sample image from dataset
    test_image_path = config.DATA_DIR / "Tomato_healthy"
    test_images = list(test_image_path.glob("*.jpg"))[:1]
    
    if test_images:
        print(f"\nTesting with image: {test_images[0].name}")
        result = predictor.predict(test_images[0], top_k=3)
        
        print(f"\n🔍 Prediction Results:")
        print(f"  Top Prediction: {result['top_prediction']['disease']}")
        print(f"  Confidence: {result['top_prediction']['confidence_percent']}")
        
        print(f"\n  All Top-3 Predictions:")
        for i, pred in enumerate(result['predictions'], 1):
            print(f"    {i}. {pred['disease']}: {pred['confidence_percent']}")
        
        print(f"\n  Disease Info:")
        print(f"    - Severity: {result['disease_info']['severity']}")
        print(f"    - Description: {result['disease_info']['description']}")
