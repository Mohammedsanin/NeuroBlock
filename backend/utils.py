"""Utility functions for data validation and processing."""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any


def detect_column_type(series: pd.Series) -> str:
    """
    Detect the type of a column.
    
    Returns:
        'numeric', 'categorical', or 'text'
    """
    # Check if numeric
    if pd.api.types.is_numeric_dtype(series):
        return 'numeric'
    
    # Check for categorical (low cardinality)
    unique_count = series.nunique()
    total_count = len(series)
    
    if unique_count < total_count * 0.5 and unique_count < 10:
        return 'categorical'
    
    return 'text'


def detect_problem_type(series: pd.Series) -> str:
    """
    Detect if the target variable indicates a classification or regression problem.
    
    Args:
        series: Target variable series
        
    Returns:
        'classification' or 'regression'
    """
    # If target is categorical/text, it's classification
    if not pd.api.types.is_numeric_dtype(series):
        return 'classification'
    
    # If numeric, check number of unique values
    unique_count = series.nunique()
    total_count = len(series)
    
    # If very few unique values (< 20) or less than 5% unique, likely classification
    if unique_count < 20 or (unique_count / total_count) < 0.05:
        return 'classification'
    
    # Otherwise, it's regression
    return 'regression'


def validate_dataset(df: pd.DataFrame) -> Tuple[bool, str]:
    """
    Validate that the dataset is suitable for ML.
    
    Returns:
        (is_valid, error_message)
    """
    if df.empty:
        return False, "Dataset is empty"
    
    if len(df) < 10:
        return False, "Dataset must have at least 10 rows"
    
    if len(df.columns) < 2:
        return False, "Dataset must have at least 2 columns (features + target)"
    
    return True, ""


def validate_feature_target_selection(
    df: pd.DataFrame,
    input_features: List[str],
    target_variable: str
) -> Tuple[bool, str]:
    """
    Validate feature and target selection.
    
    Returns:
        (is_valid, error_message)
    """
    # Check if columns exist
    all_columns = set(df.columns)
    
    if target_variable not in all_columns:
        return False, f"Target variable '{target_variable}' not found in dataset"
    
    for feature in input_features:
        if feature not in all_columns:
            return False, f"Feature '{feature}' not found in dataset"
    
    # Check for overlap
    if target_variable in input_features:
        return False, "Target variable cannot be in input features"
    
    # Check minimum features
    if len(input_features) < 1:
        return False, "At least one input feature must be selected"
    
    return True, ""


def get_column_info(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Get detailed information about dataset columns.
    
    Returns:
        Dictionary with column names, types, and statistics
    """
    column_info = {}
    
    for col in df.columns:
        col_type = detect_column_type(df[col])
        info = {
            'type': col_type,
            'missing_count': int(df[col].isna().sum()),
            'missing_percentage': float(df[col].isna().sum() / len(df) * 100)
        }
        
        if col_type == 'numeric':
            info['min'] = float(df[col].min()) if not df[col].isna().all() else None
            info['max'] = float(df[col].max()) if not df[col].isna().all() else None
            info['mean'] = float(df[col].mean()) if not df[col].isna().all() else None
        elif col_type == 'categorical':
            info['unique_values'] = int(df[col].nunique())
            info['top_values'] = df[col].value_counts().head(5).to_dict()
        
        column_info[col] = info
    
    return column_info


def safe_convert_to_serializable(obj: Any) -> Any:
    """
    Convert numpy/pandas types to Python native types for JSON serialization.
    """
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: safe_convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_convert_to_serializable(item) for item in obj]
    return obj
