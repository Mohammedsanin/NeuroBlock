# NeuroBlocks ML Backend

Python Flask backend for real machine learning training and predictions.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Start the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Upload Dataset
```
POST /api/upload
Content-Type: multipart/form-data

Body: file (CSV or Excel)
```

### Train Model
```
POST /api/train
Content-Type: application/json

Body:
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
```

### Make Predictions
```
POST /api/predict
Content-Type: application/json

Body:
{
  "session_id": "session_0",
  "data": [
    {"feature1": 1.0, "feature2": 2.0},
    {"feature1": 1.5, "feature2": 2.5}
  ]
}
```

## Supported Models

- **Logistic Regression** (`logistic`)
- **Decision Tree** (`decision_tree`)
- **Random Forest** (`random_forest`)
- **Support Vector Machine** (`svm`)
- **K-Nearest Neighbors** (`knn`)
- **Neural Network** (`neural_network`)

## Features

- ✅ Real ML training with scikit-learn
- ✅ Automatic data preprocessing
- ✅ Feature encoding for categorical variables
- ✅ Missing value handling
- ✅ Train-test splitting
- ✅ Comprehensive metrics (accuracy, precision, recall, F1, confusion matrix)
- ✅ Feature importance calculation
- ✅ Session-based data management

## File Structure

```
backend/
├── app.py              # Flask API server
├── ml_pipeline.py      # ML processing logic
├── utils.py            # Helper functions
└── requirements.txt    # Python dependencies
```

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify the port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### CORS Issues
CORS is enabled by default. If you encounter issues, check the Flask-CORS configuration in `app.py`.

### Missing Dependencies
Make sure you're in the virtual environment and all dependencies are installed:
```bash
pip install -r requirements.txt
```
