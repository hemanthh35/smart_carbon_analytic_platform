import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder

def preprocess_data(file_path):
    print(f"Loading dataset from: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file not found at: {file_path}")
        
    df_raw = pd.read_csv(file_path)
    orig_rows, orig_cols = df_raw.shape
    print(f"Original shape: {orig_rows} rows, {orig_cols} columns")
    
    # 2. Keep specific columns (Change 1: Keep start_time, Drop end_time)
    keep_cols = [
        'source_id',
        'iso3_country',
        'source_type',
        'sector',
        'subsector',
        'start_time',
        'gas',
        'activity',
        'activity_units',
        'emissions_factor',
        'emissions_factor_units',
        'capacity',
        'capacity_units',
        'capacity_factor',
        'lat',
        'lon',
        'emissions_quantity'
    ]
    
    # Check if all columns are present
    missing_cols = [c for c in keep_cols if c not in df_raw.columns]
    if missing_cols:
        raise ValueError(f"Required columns missing from raw data: {missing_cols}")
        
    df = df_raw[keep_cols].copy()
    
    # Change 3: Check Missing Values
    # If any column has > 30% missing, drop it. Otherwise impute.
    missing_pct = df.isnull().mean()
    dropped_missing_cols = missing_pct[missing_pct > 0.3].index.tolist()
    if dropped_missing_cols:
        print(f"Dropping columns with > 30% missing values: {dropped_missing_cols}")
        df = df.drop(columns=dropped_missing_cols)
        keep_cols = [c for c in keep_cols if c not in dropped_missing_cols]
    else:
        print("No columns have > 30% missing values.")
        
    # Record missing value statistics BEFORE imputation (for remaining columns)
    missing_stats = df.isna().sum().to_dict()
    
    # Convert start_time into datetime format
    df['start_time'] = pd.to_datetime(df['start_time'])
    
    # Sort the dataset by source_id, start_time (essential for feature engineering)
    df = df.sort_values(by=['source_id', 'start_time']).reset_index(drop=True)
    
    # Change 4: Check Target Distribution
    emissions_summary_raw = df['emissions_quantity'].describe().to_dict()
    skewness = df['emissions_quantity'].skew()
    print(f"Target variable 'emissions_quantity' skewness: {skewness:.4f}")
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Plot and save target distribution (non-blocking)
    plt.figure(figsize=(10, 6))
    df['emissions_quantity'].hist(bins=50, color='skyblue', edgecolor='black')
    plt.title(f"Target Distribution of emissions_quantity (Skewness: {skewness:.2f})")
    plt.xlabel("emissions_quantity")
    plt.ylabel("Frequency")
    raw_plot_path = os.path.join(output_dir, "emissions_histogram_raw.png")
    plt.savefig(raw_plot_path)
    plt.close()
    print(f"Saved raw distribution histogram to {raw_plot_path}")
    
    # Apply log1p transform if extremely skewed (skewness > 1.0)
    applied_log1p = False
    if skewness > 1.0:
        print("Target is extremely skewed (> 1.0). Applying log1p transformation.")
        df['emissions_quantity'] = np.log1p(df['emissions_quantity'])
        applied_log1p = True
        
        # Save log-transformed distribution plot
        plt.figure(figsize=(10, 6))
        df['emissions_quantity'].hist(bins=50, color='lightgreen', edgecolor='black')
        plt.title(f"Log-Transformed Target Distribution (Skewness: {df['emissions_quantity'].skew():.2f})")
        plt.xlabel("log1p(emissions_quantity)")
        plt.ylabel("Frequency")
        log_plot_path = os.path.join(output_dir, "emissions_histogram_log.png")
        plt.savefig(log_plot_path)
        plt.close()
        print(f"Saved log-transformed distribution histogram to {log_plot_path}")
        
    # Change 5: Add Facility History Features (Grouped by source_id)
    print("Generating lag and rolling mean features grouped by source_id...")
    grouped = df.groupby('source_id')
    
    # Lags (1, 3, 6, 12)
    for lag in [1, 3, 6, 12]:
        df[f'emission_lag_{lag}'] = grouped['emissions_quantity'].shift(lag)
        
    # Rolling averages (3, 6, 12) of previous values to prevent data leakage
    df['emissions_quantity_shifted'] = grouped['emissions_quantity'].shift(1)
    grouped_shifted = df.groupby('source_id')['emissions_quantity_shifted']
    
    for window in [3, 6, 12]:
        df[f'rolling_mean_{window}'] = grouped_shifted.transform(
            lambda x: x.rolling(window=window, min_periods=1).mean()
        )
        
    df = df.drop(columns=['emissions_quantity_shifted'])
    
    # Handle missing values after lag generation
    # Categorical vs Numerical lists for remaining columns
    categorical_cols = [
        'iso3_country', 'source_type', 'sector', 'subsector', 'gas',
        'activity', 'activity_units', 'emissions_factor_units', 'capacity_units'
    ]
    categorical_cols = [c for c in categorical_cols if c in df.columns]
    
    numerical_cols = [
        'emissions_factor', 'capacity', 'capacity_factor', 'lat', 'lon',
        'emission_lag_1', 'emission_lag_3', 'emission_lag_6', 'emission_lag_12',
        'rolling_mean_3', 'rolling_mean_6', 'rolling_mean_12'
    ]
    numerical_cols = [c for c in numerical_cols if c in df.columns]
    
    # Numerical columns -> median imputation
    for col in numerical_cols:
        median_val = df[col].median()
        if pd.isna(median_val):
            median_val = 0.0
        df[col] = df[col].fillna(median_val)
        
    # Categorical columns -> mode imputation
    for col in categorical_cols:
        if not df[col].mode().empty:
            mode_val = df[col].mode()[0]
            df[col] = df[col].fillna(mode_val)
        else:
            df[col] = df[col].fillna("Missing")
            
    # Extract: year, month, quarter from start_time
    df['year'] = df['start_time'].dt.year
    df['month'] = df['start_time'].dt.month
    df['quarter'] = df['start_time'].dt.quarter
    
    # 8. Label encode categorical columns
    for col in categorical_cols:
        df[col] = df[col].astype(str)
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        
    # Ensure columns are ordered logically
    final_cols = [
        'source_id',
        'start_time',
        'iso3_country',
        'source_type',
        'sector',
        'subsector',
        'gas',
        'activity',
        'activity_units',
        'emissions_factor',
        'emissions_factor_units',
        'capacity',
        'capacity_units',
        'capacity_factor',
        'lat',
        'lon',
        'year',
        'month',
        'quarter',
        'emission_lag_1',
        'emission_lag_3',
        'emission_lag_6',
        'emission_lag_12',
        'rolling_mean_3',
        'rolling_mean_6',
        'rolling_mean_12',
        'emissions_quantity'
    ]
    final_cols = [c for c in final_cols if c in df.columns]
    df = df[final_cols]
    
    final_rows, final_cols_count = df.shape
    unique_facilities = df['source_id'].nunique()
    min_date = df['start_time'].min()
    max_date = df['start_time'].max()
    emissions_summary_final = df['emissions_quantity'].describe().to_dict()
    
    # Generate Preprocessing Report
    report = []
    report.append("=" * 60)
    report.append("               PREPROCESSING REPORT")
    report.append("=" * 60)
    report.append(f"Original shape: {orig_rows} rows, {orig_cols} columns")
    report.append(f"Final shape:    {final_rows} rows, {final_cols_count} columns")
    report.append(f"Unique facility count (source_id): {unique_facilities}")
    report.append(f"Date range:     {min_date} to {max_date}")
    report.append("-" * 60)
    report.append(f"Columns dropped with >30% missing values: {dropped_missing_cols}")
    report.append("-" * 60)
    report.append("Missing Value Statistics (Before Imputation):")
    for col, count in missing_stats.items():
        report.append(f"  - {col}: {count} missing value(s)")
    report.append("-" * 60)
    report.append("Target emissions_quantity Transformation:")
    report.append(f"  - Original Skewness: {skewness:.4f}")
    report.append(f"  - Applied log1p Transformation: {applied_log1p}")
    report.append(f"  - Final Skewness: {df['emissions_quantity'].skew():.4f}")
    report.append("-" * 60)
    report.append("Summary Statistics of emissions_quantity (Target):")
    for stat, val in emissions_summary_final.items():
        report.append(f"  - {stat}: {val:.4f}")
    report.append("=" * 60)
    
    report_text = "\n".join(report)
    print(report_text)
    
    report_path = os.path.join(output_dir, "preprocessing_report.txt")
    with open(report_path, "w") as f:
        f.write(report_text)
    print(f"Saved report to {report_path}")
    
    csv_path = os.path.join(output_dir, "iron_steel_preprocessed.csv")
    df.to_csv(csv_path, index=False)
    print(f"Saved cleaned dataset to {csv_path}")
    
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    raw_dataset_path = os.path.abspath(os.path.join(script_dir, "../datasets/DATA/iron-and-steel_emissions_sources_v5_7_0.csv"))
    preprocess_data(raw_dataset_path)
