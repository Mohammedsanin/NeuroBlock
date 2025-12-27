# Model Filtering by Problem Type

## Classification Models
- Logistic Regression
- Decision Tree
- Random Forest
- SVM
- KNN
- Neural Network (MLP)

## Regression Models  
- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- SVR (Support Vector Regression)
- KNN Regressor
- Neural Network Regressor (MLP)

## Auto-Detection Logic

The system detects problem type based on the target variable:

**Classification** if:
- Target is text/categorical (non-numeric)
- Target is numeric with < 20 unique values
- Target is numeric with < 5% unique ratio

**Regression** if:
- Target is numeric with >= 20 unique values
- Target is numeric with >= 5% unique ratio

This ensures users only see relevant models for their specific problem!
