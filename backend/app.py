"""Flask API server for ML pipeline."""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import traceback
from typing import Dict, Any
from dotenv import load_dotenv
import os

from ml_pipeline import MLPipeline
from utils import (
    validate_dataset,
    validate_feature_target_selection,
    get_column_info,
    safe_convert_to_serializable,
    detect_problem_type
)
from ai_explainer import AIExplainer

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Store pipeline instances per session (in production, use Redis or similar)
pipelines: Dict[str, MLPipeline] = {}

# Initialize AI explainer (will use GEMINI_API_KEY from environment)
try:
    ai_explainer = AIExplainer()
    print("✅ AI Explainer initialized with Gemini API")
except Exception as e:
    print(f"⚠️  AI Explainer not available: {e}")
    ai_explainer = None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'ML Backend is running'})


@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    """
    Upload and parse dataset.
    
    Expected: multipart/form-data with 'file' field
    Returns: Dataset metadata including columns, types, and preview
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read the file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file.read()))
        else:
            return jsonify({'error': 'Unsupported file format. Use CSV or Excel'}), 400
        
        # Validate dataset
        is_valid, error_msg = validate_dataset(df)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Get column information
        column_info = get_column_info(df)
        
        # Create preview (first 10 rows)
        preview = df.head(10).to_dict('records')
        preview = safe_convert_to_serializable(preview)
        
        # Generate session ID (in production, use proper session management)
        session_id = f"session_{len(pipelines)}"
        
        # Store dataframe for this session
        pipeline = MLPipeline()
        pipeline.original_df = df
        pipelines[session_id] = pipeline
        
        response = {
            'session_id': session_id,
            'file_name': file.filename,
            'rows': len(df),
            'columns': list(df.columns),
            'column_info': column_info,
            'preview': preview
        }
        
        return jsonify(safe_convert_to_serializable(response))
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 500


@app.route('/api/train', methods=['POST'])
def train_model():
    """
    Train ML model with selected features and configuration.
    
    Expected JSON:
    {
        "session_id": "session_0",
        "input_features": ["feature1", "feature2"],
        "target_variable": "target",
        "preprocessing": {
            "standardization": true,
            "normalization": false,
            "handle_missing": true,
            "missing_strategy": "mean",
            "encode_categories": true
        },
        "split_ratio": 70,
        "model_type": "random_forest",
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 10
        }
    }
    
    Returns: Training results with metrics
    """
    try:
        data = request.get_json()
        
        # Validate request
        required_fields = ['session_id', 'input_features', 'target_variable', 'model_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        session_id = data['session_id']
        if session_id not in pipelines:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        pipeline = pipelines[session_id]
        df = pipeline.original_df
        
        input_features = data['input_features']
        target_variable = data['target_variable']
        
        # Validate feature/target selection
        is_valid, error_msg = validate_feature_target_selection(
            df, input_features, target_variable
        )
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Get configuration
        preprocessing_config = data.get('preprocessing', {})
        split_ratio = data.get('split_ratio', 70)
        model_type = data['model_type']
        hyperparameters = data.get('hyperparameters', {})
        
        # Preprocess data
        X, y = pipeline.preprocess_data(
            df, input_features, target_variable, preprocessing_config
        )
        
        # Split data
        test_size = (100 - split_ratio) / 100
        pipeline.split_data(X, y, test_size=test_size)
        
        # Train model
        results = pipeline.train_model(model_type, hyperparameters)
        
        return jsonify(safe_convert_to_serializable(results))
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Training failed: {str(e)}'}), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Make predictions on new data.
    
    Expected JSON:
    {
        "session_id": "session_0",
        "data": [{"feature1": 1.0, "feature2": 2.0}, ...]
    }
    
    Returns: Predictions
    """
    try:
        data = request.get_json()
        
        session_id = data.get('session_id')
        if not session_id or session_id not in pipelines:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        pipeline = pipelines[session_id]
        
        if pipeline.model is None:
            return jsonify({'error': 'No trained model found. Train a model first.'}), 400
        
        # Convert input data to DataFrame
        input_data = pd.DataFrame(data['data'])
        
        # Make predictions
        predictions = pipeline.model.predict(input_data)
        
        return jsonify({
            'predictions': safe_convert_to_serializable(predictions.tolist())
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/api/explain', methods=['POST'])
def explain_step():
    """
    Get AI-powered explanation for a pipeline step.
    
    Expected JSON:
    {
        "stepType": "dataset",
        "datasetInfo": {
            "fileName": "data.csv",
            "rows": 100,
            "columns": ["col1", "col2"],
            "columnTypes": {"col1": "numeric", "col2": "categorical"}
        }
    }
    
    Returns: AI-generated explanation
    """
    try:
        if not ai_explainer:
            return jsonify({
                'error': 'AI Explainer not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        data = request.get_json()
        step_type = data.get('stepType', 'dataset')
        dataset_info = data.get('datasetInfo')
        
        explanation = ai_explainer.get_step_explanation(step_type, dataset_info)
        
        return jsonify({'explanation': explanation})
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate explanation: {str(e)}'}), 500


if __name__ == '__main__':
    print("🚀 Starting ML Backend Server...")
    print("📊 Server running on http://localhost:5000")
    print("✅ Ready to process ML requests!")
    app.run(debug=True, host='0.0.0.0', port=5000)
