"""AI explanation service using Google Gemini API."""

import google.generativeai as genai
import os
from typing import Dict, Optional


class AIExplainer:
    """Provides AI-powered explanations for ML pipeline steps using Gemini."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the AI explainer.
        
        Args:
            api_key: Google Gemini API key. If None, reads from GEMINI_API_KEY env var.
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def get_step_explanation(
        self,
        step_type: str,
        dataset_info: Optional[Dict] = None
    ) -> str:
        """
        Get an AI-generated explanation for a specific ML pipeline step.
        
        Args:
            step_type: Type of step (dataset, preprocess, feature, split, model, results)
            dataset_info: Optional dataset information for context
            
        Returns:
            AI-generated explanation text
        """
        # Build context about the dataset if available
        dataset_context = ""
        if dataset_info:
            columns_preview = ", ".join(dataset_info.get('columns', [])[:8])
            if len(dataset_info.get('columns', [])) > 8:
                columns_preview += f" and {len(dataset_info['columns']) - 8} more"
            
            column_types = dataset_info.get('columnTypes', {})
            types_preview = ", ".join([
                f"{col} ({type_})" 
                for col, type_ in list(column_types.items())[:5]
            ])
            
            dataset_context = f"""
The user has uploaded a dataset called "{dataset_info.get('fileName', 'dataset.csv')}" with:
- {dataset_info.get('rows', 0)} rows and {len(dataset_info.get('columns', []))} columns
- Columns: {columns_preview}
- Column types: {types_preview}
"""
        
        # Define prompts for each step type
        step_prompts = {
            'dataset': f"""Explain what happens when a user uploads a dataset for machine learning. {dataset_context if dataset_context else ""}
Explain in 2-3 simple sentences:
- What the tool does with the uploaded data
- Why this step is important for beginners""",
            
            'preprocess': f"""Explain preprocessing in machine learning for beginners. {f"The user's dataset has these columns: {', '.join(dataset_info.get('columns', [])[:5])}" if dataset_info else ""}
Explain in 2-3 simple sentences:
- What standardization and normalization do to the data
- Why this helps the model learn better
Use a simple real-world analogy if helpful.""",
            
            'feature': f"""Explain feature engineering in machine learning for beginners. {f"The user's dataset has: {', '.join([f'{col} ({type_})' for col, type_ in list(dataset_info.get('columnTypes', {}).items())[:4]])}" if dataset_info else ""}
Explain in 2-3 simple sentences:
- What handling missing values means
- What encoding categorical variables does
- Why creating new features can help
Keep it very simple and beginner-friendly.""",
            
            'split': f"""Explain train-test split in machine learning for beginners. {f"The user has {dataset_info.get('rows', 0)} data points to split." if dataset_info else ""}
Explain in 2-3 simple sentences:
- Why we divide data into training and testing sets
- What a good split ratio means
Use a simple analogy like studying for an exam.""",
            
            'model': """Explain model selection in machine learning for beginners. Keep it very simple.
Explain in 2-3 sentences:
- What a machine learning model does
- Why different models work for different problems
- What hyperparameters are (in very simple terms)""",
            
            'results': """Explain how to interpret machine learning results for beginners.
Explain in 2-3 simple sentences:
- What accuracy means
- What a confusion matrix shows
- How to know if the model is good"""
        }
        
        system_prompt = """You are a friendly ML tutor explaining concepts to complete beginners with zero coding or machine learning background.
- Use simple everyday language
- Avoid technical jargon
- Use analogies to everyday life
- Keep explanations to 2-4 sentences max
- Be encouraging and supportive
- If dataset info is provided, reference specific column names or data types to make it personal"""
        
        user_prompt = step_prompts.get(
            step_type,
            "Explain this ML pipeline step simply."
        )
        
        # Combine system and user prompts
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return self._get_fallback_explanation(step_type)
    
    def _get_fallback_explanation(self, step_type: str) -> str:
        """Provide fallback explanations if API fails."""
        fallbacks = {
            'dataset': "Upload your data file (CSV or Excel) to get started. The system will analyze your columns and prepare them for machine learning!",
            'preprocess': "This step cleans and scales your data so all features are on the same playing field, helping the model learn better.",
            'feature': "Here you can handle missing values, convert text categories to numbers, and create new useful features from existing ones.",
            'split': "We split your data into training (to teach the model) and testing (to see how well it learned) - like studying with practice problems and then taking a test!",
            'model': "Choose which type of AI algorithm will learn patterns from your data. Different models work better for different types of problems.",
            'results': "See how well your model performed! Higher accuracy means more correct predictions. The confusion matrix shows where it got things right or wrong."
        }
        return fallbacks.get(step_type, "This step helps prepare or evaluate your machine learning model.")
