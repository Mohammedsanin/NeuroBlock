"""ML Pipeline processing logic."""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
from typing import Dict, List, Tuple, Any, Optional
import warnings
warnings.filterwarnings('ignore')

from utils import safe_convert_to_serializable


class MLPipeline:
    """Handles the complete ML pipeline from preprocessing to evaluation."""
    
    def __init__(self):
        self.scaler = None
        self.label_encoders = {}
        self.feature_names = []
        self.target_name = None
        self.model = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        
    def preprocess_data(
        self,
        df: pd.DataFrame,
        input_features: List[str],
        target_variable: str,
        config: Dict[str, Any]
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Preprocess the dataset based on configuration.
        
        Args:
            df: Input dataframe
            input_features: List of feature column names
            target_variable: Target column name
            config: Preprocessing configuration
            
        Returns:
            (X, y) preprocessed features and target
        """
        df = df.copy()
        
        # Extract features and target
        X = df[input_features].copy()
        y = df[target_variable].copy()
        
        self.feature_names = input_features
        self.target_name = target_variable
        
        # Handle missing values
        if config.get('handle_missing', False):
            strategy = config.get('missing_strategy', 'mean')
            for col in X.columns:
                if X[col].isna().any():
                    if pd.api.types.is_numeric_dtype(X[col]):
                        imputer = SimpleImputer(strategy=strategy)
                        X[col] = imputer.fit_transform(X[[col]]).ravel()
                    else:
                        # For categorical, use most frequent
                        imputer = SimpleImputer(strategy='most_frequent')
                        X[col] = imputer.fit_transform(X[[col]]).ravel()
        
        # Encode categorical features
        if config.get('encode_categories', False):
            for col in X.columns:
                if not pd.api.types.is_numeric_dtype(X[col]):
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
                    self.label_encoders[col] = le
        
        # Encode target if categorical
        if not pd.api.types.is_numeric_dtype(y):
            le = LabelEncoder()
            y = le.fit_transform(y.astype(str))
            self.label_encoders[target_variable] = le
        
        # Standardization
        if config.get('standardization', False):
            self.scaler = StandardScaler()
            X = pd.DataFrame(
                self.scaler.fit_transform(X),
                columns=X.columns,
                index=X.index
            )
        
        # Normalization
        elif config.get('normalization', False):
            self.scaler = MinMaxScaler()
            X = pd.DataFrame(
                self.scaler.fit_transform(X),
                columns=X.columns,
                index=X.index
            )
        
        return X, y
    
    def split_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.3,
        random_state: int = 42
    ):
        """Split data into train and test sets."""
        # Check if stratification is possible
        unique_classes, class_counts = np.unique(y, return_counts=True)
        min_class_count = class_counts.min()
        
        # Only stratify if all classes have at least 2 samples
        stratify_param = y if (len(unique_classes) > 1 and min_class_count >= 2) else None
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify_param
        )
    
    def train_model(
        self,
        model_type: str,
        hyperparameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Train the specified model.
        
        Args:
            model_type: Type of model to train
            hyperparameters: Model hyperparameters
            
        Returns:
            Training results and metrics
        """
        if hyperparameters is None:
            hyperparameters = {}
        
        # Detect if this is classification or regression
        is_classification = len(np.unique(self.y_train)) < 50 and not np.issubdtype(self.y_train.dtype, np.floating)
        
        # Initialize model based on type and problem
        if model_type == 'logistic' or model_type == 'linear':
            if is_classification:
                self.model = LogisticRegression(
                    max_iter=hyperparameters.get('max_iter', 1000),
                    random_state=42
                )
            else:
                self.model = LinearRegression()
                
        elif model_type == 'decision_tree':
            if is_classification:
                self.model = DecisionTreeClassifier(
                    max_depth=hyperparameters.get('max_depth', None),
                    min_samples_split=hyperparameters.get('min_samples_split', 2),
                    random_state=42
                )
            else:
                self.model = DecisionTreeRegressor(
                    max_depth=hyperparameters.get('max_depth', None),
                    min_samples_split=hyperparameters.get('min_samples_split', 2),
                    random_state=42
                )
                
        elif model_type == 'random_forest':
            if is_classification:
                self.model = RandomForestClassifier(
                    n_estimators=hyperparameters.get('n_estimators', 100),
                    max_depth=hyperparameters.get('max_depth', None),
                    random_state=42
                )
            else:
                self.model = RandomForestRegressor(
                    n_estimators=hyperparameters.get('n_estimators', 100),
                    max_depth=hyperparameters.get('max_depth', None),
                    random_state=42
                )
                
        elif model_type == 'svm':
            if is_classification:
                self.model = SVC(
                    C=hyperparameters.get('C', 1.0),
                    kernel=hyperparameters.get('kernel', 'rbf'),
                    random_state=42
                )
            else:
                self.model = SVR(
                    C=hyperparameters.get('C', 1.0),
                    kernel=hyperparameters.get('kernel', 'rbf')
                )
                
        elif model_type == 'knn':
            if is_classification:
                self.model = KNeighborsClassifier(
                    n_neighbors=hyperparameters.get('n_neighbors', 5)
                )
            else:
                self.model = KNeighborsRegressor(
                    n_neighbors=hyperparameters.get('n_neighbors', 5)
                )
                
        elif model_type == 'neural_network':
            if is_classification:
                self.model = MLPClassifier(
                    hidden_layer_sizes=hyperparameters.get('hidden_layer_sizes', (100,)),
                    max_iter=hyperparameters.get('max_iter', 500),
                    random_state=42
                )
            else:
                self.model = MLPRegressor(
                    hidden_layer_sizes=hyperparameters.get('hidden_layer_sizes', (100,)),
                    max_iter=hyperparameters.get('max_iter', 500),
                    random_state=42
                )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Train the model
        self.model.fit(self.X_train, self.y_train)
        
        # Make predictions
        y_train_pred = self.model.predict(self.X_train)
        y_test_pred = self.model.predict(self.X_test)
        
        # Store predictions for visualization
        self.y_test_pred = y_test_pred
        self.y_test_actual = self.y_test
        
        # Calculate metrics
        results = self._calculate_metrics(y_train_pred, y_test_pred, is_classification)
        
        # Add predictions to results for export/visualization
        results['predictions'] = {
            'actual': self.y_test.tolist() if hasattr(self.y_test, 'tolist') else list(self.y_test),
            'predicted': y_test_pred.tolist() if hasattr(y_test_pred, 'tolist') else list(y_test_pred)
        }
        
        return results
    
    def _calculate_metrics(
        self,
        y_train_pred: np.ndarray,
        y_test_pred: np.ndarray,
        is_classification: bool = True
    ) -> Dict[str, Any]:
        """Calculate evaluation metrics."""
        
        if is_classification:
            # Determine if binary or multiclass
            n_classes = len(np.unique(self.y_test))
            average = 'binary' if n_classes == 2 else 'weighted'
            
            # Test metrics
            test_accuracy = accuracy_score(self.y_test, y_test_pred)
            test_precision = precision_score(self.y_test, y_test_pred, average=average, zero_division=0)
            test_recall = recall_score(self.y_test, y_test_pred, average=average, zero_division=0)
            test_f1 = f1_score(self.y_test, y_test_pred, average=average, zero_division=0)
            
            # Train metrics
            train_accuracy = accuracy_score(self.y_train, y_train_pred)
            
            # Confusion matrix
            cm = confusion_matrix(self.y_test, y_test_pred)
            
            results = {
                'test_metrics': {
                    'accuracy': float(test_accuracy),
                    'precision': float(test_precision),
                    'recall': float(test_recall),
                    'f1_score': float(test_f1)
                },
                'train_metrics': {
                    'accuracy': float(train_accuracy)
                },
                'confusion_matrix': cm.tolist(),
            }
        else:
            # Regression metrics
            test_mse = mean_squared_error(self.y_test, y_test_pred)
            test_rmse = np.sqrt(test_mse)
            test_mae = mean_absolute_error(self.y_test, y_test_pred)
            test_r2 = r2_score(self.y_test, y_test_pred)
            
            train_mse = mean_squared_error(self.y_train, y_train_pred)
            train_r2 = r2_score(self.y_train, y_train_pred)
            
            # For regression, use R² as "accuracy" for consistency with UI
            results = {
                'test_metrics': {
                    'accuracy': float(max(0, test_r2)),  # R² can be negative, clamp to 0
                    'precision': float(test_r2),  # Use R² for precision too
                    'recall': float(1 - test_mae / (np.std(self.y_test) + 1e-10)),  # Normalized MAE
                    'f1_score': float(test_r2)
                },
                'train_metrics': {
                    'accuracy': float(max(0, train_r2))
                },
                'confusion_matrix': [[0, 0], [0, 0]],  # Dummy for regression
                'regression_metrics': {
                    'mse': float(test_mse),
                    'rmse': float(test_rmse),
                    'mae': float(test_mae),
                    'r2_score': float(test_r2)
                }
            }
        
        # Feature importance (if available)
        feature_importance = None
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = {
                name: float(importance)
                for name, importance in zip(self.feature_names, self.model.feature_importances_)
            }
        elif hasattr(self.model, 'coef_'):
            # For linear models, use absolute coefficient values
            coef = np.abs(self.model.coef_[0]) if len(self.model.coef_.shape) > 1 else np.abs(self.model.coef_)
            feature_importance = {
                name: float(importance)
                for name, importance in zip(self.feature_names, coef)
            }
        
        results['feature_importance'] = feature_importance
        results['n_train_samples'] = int(len(self.y_train))
        results['n_test_samples'] = int(len(self.y_test))
        results['n_features'] = int(len(self.feature_names))
        results['feature_names'] = self.feature_names
        results['target_name'] = self.target_name
        
        return safe_convert_to_serializable(results)
