/**
 * API client for ML backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export interface ColumnInfo {
    type: 'numeric' | 'categorical' | 'text';
    missing_count: number;
    missing_percentage: number;
    min?: number;
    max?: number;
    mean?: number;
    unique_values?: number;
    top_values?: Record<string, number>;
}

export interface UploadResponse {
    session_id: string;
    file_name: string;
    rows: number;
    columns: string[];
    column_info: Record<string, ColumnInfo>;
    preview: Record<string, any>[];
}

export interface TrainingRequest {
    session_id: string;
    input_features: string[];
    target_variable: string;
    preprocessing: {
        standardization?: boolean;
        normalization?: boolean;
        handle_missing?: boolean;
        missing_strategy?: 'mean' | 'median' | 'most_frequent' | 'mode' | 'drop';
        encode_categories?: boolean;
    };
    split_ratio: number;
    model_type: string;
    hyperparameters?: Record<string, any>;
}

export interface TrainingResponse {
    test_metrics: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
    };
    train_metrics: {
        accuracy: number;
    };
    confusion_matrix: number[][];
    feature_importance: Record<string, number> | null;
    n_train_samples: number;
    n_test_samples: number;
    n_features: number;
    feature_names: string[];
    target_name: string;
    predictions?: {
        actual: number[];
        predicted: number[];
    };
    regression_metrics?: {
        mse: number;
        rmse: number;
        mae: number;
        r2_score: number;
    };
}

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return data.status === 'healthy';
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * Upload dataset to backend
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload dataset');
    }

    return response.json();
}

/**
 * Train ML model
 */
export async function trainModel(request: TrainingRequest): Promise<TrainingResponse> {
    const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to train model');
    }

    return response.json();
}

/**
 * Make predictions
 */
export async function makePredictions(
    sessionId: string,
    data: Record<string, any>[]
): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            data,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to make predictions');
    }

    const result = await response.json();
    return result.predictions;
}
