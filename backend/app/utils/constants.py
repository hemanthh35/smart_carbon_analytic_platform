"""Application constants."""


class Roles:
    ADMIN = "admin"
    USER = "user"
    ALL = [ADMIN, USER]


class TokenTypes:
    ACCESS = "access"
    REFRESH = "refresh"


class AuditActions:
    REGISTER = "REGISTER"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PREDICT = "PREDICT"
    CARBON_CREDIT = "CARBON_CREDIT"
    GENERATE_REPORT = "GENERATE_REPORT"
    DOWNLOAD_REPORT = "DOWNLOAD_REPORT"
    DELETE_USER = "DELETE_USER"
    UPDATE_USER = "UPDATE_USER"


class ReportTypes:
    FACILITY = "facility"
    COUNTRY = "country"
    GENERAL = "general"


# Prediction feature columns (must match training order)
FEATURE_COLUMNS = [
    "iso3_country",
    "source_type",
    "sector",
    "subsector",
    "gas",
    "activity",
    "activity_units",
    "emissions_factor",
    "emissions_factor_units",
    "capacity",
    "capacity_units",
    "capacity_factor",
    "lat",
    "lon",
    "year",
    "month",
    "quarter",
    "emission_lag_1",
    "emission_lag_3",
    "emission_lag_6",
    "emission_lag_12",
    "rolling_mean_3",
    "rolling_mean_6",
    "rolling_mean_12",
]

NUM_FEATURES = len(FEATURE_COLUMNS)  # 24

# Default median/mode values for simplified prediction endpoint
# (derived from the preprocessed dataset statistics)
FEATURE_DEFAULTS = {
    "iso3_country": 2,
    "source_type": 6,
    "sector": 0,
    "subsector": 0,
    "gas": 0,
    "activity": 11012,
    "activity_units": 0,
    "emissions_factor": 0.954,
    "emissions_factor_units": 0,
    "capacity_units": 0,
    "year": 2023,
    "month": 6,
    "quarter": 2,
    "emission_lag_1": 10.37,
    "emission_lag_3": 10.37,
    "emission_lag_6": 10.37,
    "emission_lag_12": 10.37,
    "rolling_mean_3": 10.37,
    "rolling_mean_6": 10.37,
    "rolling_mean_12": 10.37,
}
