"""
Validation utilities for ML pipeline
"""
from typing import Dict, List, Tuple, Optional
import pandas as pd
import numpy as np


def validate_dataset(df: pd.DataFrame) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate uploaded dataset and return helpful error messages
    
    Returns:
        (is_valid, error_message, suggestion)
    """
    # Check if dataset is empty
    if df.empty:
        return False, "Dataset is empty", "Please upload a file with data rows"
    
    # Check minimum rows
    if len(df) < 10:
        return False, f"Dataset has only {len(df)} rows", "ML models need at least 10 samples. Please upload a larger dataset"
    
    # Check if all columns are empty
    if df.isna().all().all():
        return False, "All columns contain only missing values", "Please check your data file for valid entries"
    
    # Check for too many missing values
    missing_pct = (df.isna().sum() / len(df) * 100).max()
    if missing_pct > 90:
        worst_col = (df.isna().sum() / len(df) * 100).idxmax()
        return False, f"Column '{worst_col}' has {missing_pct:.1f}% missing values", "Consider removing columns with too many missing values or use imputation"
    
    # Check if dataset has at least 2 columns
    if len(df.columns) < 2:
        return False, "Dataset must have at least 2 columns", "You need at least one input feature and one target variable"
    
    # Check for duplicate column names
    if df.columns.duplicated().any():
        dup_cols = df.columns[df.columns.duplicated()].tolist()
        return False, f"Duplicate column names found: {', '.join(dup_cols)}", "Please rename duplicate columns in your CSV file"
    
    # Check for unnamed columns
    unnamed_cols = [col for col in df.columns if 'Unnamed' in str(col)]
    if unnamed_cols:
        return False, f"Found unnamed columns: {', '.join(unnamed_cols)}", "Please add column headers to your CSV file"
    
    return True, None, None


def validate_feature_selection(
    df: pd.DataFrame,
    input_features: List[str],
    target_variable: str
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate feature and target selection
    
    Returns:
        (is_valid, error_message, suggestion)
    """
    # Check if features exist
    missing_features = [f for f in input_features if f not in df.columns]
    if missing_features:
        return False, f"Features not found: {', '.join(missing_features)}", "Please select valid column names from your dataset"
    
    # Check if target exists
    if target_variable not in df.columns:
        return False, f"Target variable '{target_variable}' not found", "Please select a valid target column"
    
    # Check if target is in features
    if target_variable in input_features:
        return False, "Target variable cannot be an input feature", "Remove the target variable from your feature selection"
    
    # Check if at least one feature selected
    if len(input_features) == 0:
        return False, "No input features selected", "Please select at least one feature column"
    
    # Check target variable variance
    if df[target_variable].nunique() == 1:
        return False, f"Target variable '{target_variable}' has only one unique value", "Target must have at least 2 different values for classification or range of values for regression"
    
    # Check for classification with too many classes
    if df[target_variable].dtype == 'object' or df[target_variable].nunique() < 20:
        n_classes = df[target_variable].nunique()
        if n_classes > 100:
            return False, f"Target has {n_classes} unique classes", "Too many classes for classification. Consider grouping categories or using regression"
    
    # Check if features have variance
    numeric_features = [f for f in input_features if pd.api.types.is_numeric_dtype(df[f])]
    zero_var_features = [f for f in numeric_features if df[f].nunique() == 1]
    if zero_var_features:
        return False, f"Features with no variance: {', '.join(zero_var_features)}", "Remove constant features as they don't provide information"
    
    return True, None, None


def get_friendly_error_message(error: Exception) -> Tuple[str, str]:
    """
    Convert technical error to user-friendly message with suggestion
    
    Returns:
        (error_message, suggestion)
    """
    error_str = str(error).lower()
    
    # File format errors
    if 'utf-8' in error_str or 'decode' in error_str:
        return "File encoding error", "Try saving your CSV with UTF-8 encoding or use Excel format (.xlsx)"
    
    if 'delimiter' in error_str or 'separator' in error_str:
        return "CSV format error", "Make sure your file uses comma (,) as separator"
    
    # Memory errors
    if 'memory' in error_str:
        return "File too large", "Try uploading a smaller dataset or sampling your data"
    
    # Value errors
    if 'could not convert' in error_str:
        return "Data type mismatch", "Check that numeric columns don't contain text values"
    
    if 'nan' in error_str or 'null' in error_str:
        return "Missing values detected", "Enable 'Handle Missing Values' in preprocessing options"
    
    # Model training errors
    if 'sample' in error_str and 'class' in error_str:
        return "Insufficient samples per class", "Each class needs at least 2 samples. Try collecting more data or combining small classes"
    
    if 'convergence' in error_str:
        return "Model didn't converge", "Try increasing max iterations in hyperparameters or scaling your features"
    
    # Default
    return "An error occurred", "Please check your data format and try again. Contact support if the issue persists"
