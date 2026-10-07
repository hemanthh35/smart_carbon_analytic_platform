# Data Preprocessing Documentation (Updated)

This document explains the **Why, What, and How** of the preprocessing and feature engineering steps applied to the `iron-and-steel_emissions_sources_v5_7_0.csv` dataset.

---

## 1. WHY We Preprocessed the Dataset

Preprocessing and feature engineering are critical steps for building a robust and high-performing time-series forecasting model. The reasons for our preprocessing choices include:

- **Dimensionality Reduction**: The original dataset has 43 columns. Dropping metadata fields (like `geometry_ref`, `created_date`, `modified_date`, etc.) and non-informative columns (like administrative columns `other1` to `other10`) reduces noise and memory usage.
- **Dropping Redundant Columns**: `end_time` was dropped because it represents a fixed monthly offset from `start_time` and adds no new predictive information.
- **Handling Skewness in Target**: The target column `emissions_quantity` is highly right-skewed. Extremely skewed targets lead to unstable model training and high Root Mean Squared Error (RMSE). Applying a `log1p` transformation normalizes the distribution, which significantly improves model metrics like RMSE and R².
- **Engineering Facility History Features**: Emissions are highly auto-correlated over time. Adding **lags** (previous records at $t-1, t-3, t-6, t-12$) and **rolling averages** (averages over the past 3, 6, and 12 records) grouped by facility (`source_id`) provides the model with critical historical context for forecasting.
- **Preserving Sequence Structure**: The facility identity `source_id` is retained in the dataset solely to group records into sequential histories for time-series modeling. It is excluded from the predictive features list to prevent the model from overfitting to specific facility IDs.
- **Missing Value Imputation**: Features are cleaned by filling numerical columns with their median and categorical columns with their mode. Any NaNs introduced due to time-shifting/rolling calculations are filled with their respective column's median to ensure no null values are fed to training.

---

## 2. WHAT We Did

We applied the following pipeline:

1. **Initial Column Selection & Drops**:
   - **Kept (17 columns)**: `source_id`, `start_time`, `iso3_country`, `source_type`, `sector`, `subsector`, `gas`, `activity`, `activity_units`, `emissions_factor`, `emissions_factor_units`, `capacity`, `capacity_units`, `capacity_factor`, `lat`, `lon`, `emissions_quantity`.
   - **Dropped (26 columns)**: `end_time`, `source_name`, `geometry_ref`, `created_date`, `modified_date`, `other1` to `other10`, `other1_def` to `other10_def`, and `temporal_granularity`.
2. **Missing Value Screening**: Checked for columns with `> 30%` missing values (none found).
3. **Sorting**: Ordered records by `source_id` (facility) and `start_time` ascendingly.
4. **Target Distribution Transform**: Analyzed the skewness of `emissions_quantity` (skewness = 3.1458). Since it was highly skewed (> 1.0), we applied a `log1p` transformation. Saved distribution plots:
   - `emissions_histogram_raw.png` (Before transform)
   - `emissions_histogram_log.png` (After transform)
5. **Feature Engineering (Facility History Features)**: Grouped by `source_id` and calculated:
   - **Lags**: `emission_lag_1`, `emission_lag_3`, `emission_lag_6`, `emission_lag_12`.
   - **Rolling Means**: `rolling_mean_3`, `rolling_mean_6`, `rolling_mean_12` (calculated on the 1-step shifted target to avoid data leakage).
6. **Imputation**: Imputed missing values (including NaNs from lag/rolling operations) using the median for numerical columns and mode for categorical columns.
7. **Datetime Formatting & Temporal Extraction**: Extracted `year`, `month`, and `quarter` from `start_time`.
8. **Label Encoding**: Label encoded categorical columns (`iso3_country`, `source_type`, `sector`, `subsector`, `gas`, `activity`, `activity_units`, `emissions_factor_units`, `capacity_units`).

---

## 3. HOW We Did It

We implemented this pipeline using Python:

- **File Path**: [preprocess.py](file:///c:/kotha_pulse_folder/Unarchive/napulse/preprocess/preprocess.py)
- **Command Used**:
  ```bash
  python preprocess/preprocess.py
  ```

### Outputs Generated in `preprocess/` Directory
- **Cleaned Dataset**: [iron_steel_preprocessed.csv](file:///c:/kotha_pulse_folder/Unarchive/napulse/preprocess/iron_steel_preprocessed.csv) (Shape: 60,039 rows, 27 columns).
- **Run Statistics / Metrics**: [preprocessing_report.txt](file:///c:/kotha_pulse_folder/Unarchive/napulse/preprocess/preprocessing_report.txt).
- **Histogram Plots**:
  - Raw Distribution: [emissions_histogram_raw.png](file:///c:/kotha_pulse_folder/Unarchive/napulse/preprocess/emissions_histogram_raw.png)
  - Log-Transformed Distribution: [emissions_histogram_log.png](file:///c:/kotha_pulse_folder/Unarchive/napulse/preprocess/emissions_histogram_log.png)
