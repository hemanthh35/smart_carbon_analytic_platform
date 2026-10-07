import os
import pandas as pd
from typing import List, Dict, Any
from app.utils.logger import get_logger

logger = get_logger("services.dataset")

# ISO3 Code to Full Country Name Mapping for all 81 countries in the dataset
COUNTRY_MAPPING = {
    "AGO": "Angola", "ALB": "Albania", "ARE": "United Arab Emirates", "ARG": "Argentina",
    "AUS": "Australia", "AUT": "Austria", "AZE": "Azerbaijan", "BEL": "Belgium",
    "BGD": "Bangladesh", "BGR": "Bulgaria", "BHR": "Bahrain", "BIH": "Bosnia and Herzegovina",
    "BLR": "Belarus", "BOL": "Bolivia", "BRA": "Brazil", "CAN": "Canada",
    "CHE": "Switzerland", "CHL": "Chile", "CHN": "China", "CZE": "Czechia",
    "DEU": "Germany", "DZA": "Algeria", "EGY": "Egypt", "ESP": "Spain",
    "FIN": "Finland", "FRA": "France", "GBR": "United Kingdom", "GHA": "Ghana",
    "GRC": "Greece", "GTM": "Guatemala", "HUN": "Hungary", "IDN": "Indonesia",
    "IND": "India", "IRN": "Iran", "IRQ": "Iraq", "ITA": "Italy",
    "JPN": "Japan", "KAZ": "Kazakhstan", "KEN": "Kenya", "KOR": "South Korea",
    "KWT": "Kuwait", "LBY": "Libya", "LUX": "Luxembourg", "MAR": "Morocco",
    "MDA": "Moldova", "MEX": "Mexico", "MKD": "North Macedonia", "MMR": "Myanmar",
    "MYS": "Malaysia", "NGA": "Nigeria", "NLD": "Netherlands", "NOR": "Norway",
    "NZL": "New Zealand", "OMN": "Oman", "PAK": "Pakistan", "PER": "Peru",
    "PHL": "Philippines", "POL": "Poland", "PRK": "North Korea", "PRT": "Portugal",
    "QAT": "Qatar", "ROU": "Romania", "RUS": "Russia", "SAU": "Saudi Arabia",
    "SGP": "Singapore", "SRB": "Serbia", "SVK": "Slovakia", "SVN": "Slovenia",
    "SWE": "Sweden", "SYR": "Syria", "THA": "Thailand", "TUR": "Turkey",
    "TWN": "Taiwan", "UGA": "Uganda", "UKR": "Ukraine", "USA": "United States",
    "UZB": "Uzbekistan", "VEN": "Venezuela", "VNM": "Vietnam", "ZAF": "South Africa",
    "ZWE": "Zimbabwe"
}

class DatasetService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        if self._initialized:
            return
            
        logger.info("Initializing Climate TRACE dataset service...")
        base_dir = os.path.abspath(os.path.dirname(__file__))
        
        # Check potential paths
        possible_paths = [
            os.path.abspath(os.path.join(base_dir, "../../datasets/DATA/iron-and-steel_emissions_sources_v5_7_0.csv")),
            os.path.abspath(os.path.join(base_dir, "../../../datasets/DATA/iron-and-steel_emissions_sources_v5_7_0.csv")),
            r"c:\kotha_pulse_folder\Unarchive\napulse\datasets\DATA\iron-and-steel_emissions_sources_v5_7_0.csv"
        ]
        
        csv_path = None
        for p in possible_paths:
            if os.path.exists(p):
                csv_path = p
                break
                
        if not csv_path:
            logger.error("Climate TRACE emissions sources CSV file not found in any expected location!")
            self._facilities = []
            self._countries = []
            self._source_types = []
            self._sectors = []
            self._subsectors = []
            self._gases = ["CO2", "CH4", "N2O"]
            self._initialized = True
            return
            
        try:
            logger.info(f"Loading CSV data from: {csv_path}")
            df = pd.read_csv(
                csv_path, 
                usecols=['source_id', 'source_name', 'iso3_country', 'source_type', 'sector', 'subsector', 'gas', 'lat', 'lon']
            )
            
            # Unique facilities (grouped by source_id)
            fac_df = df.groupby('source_id').first().reset_index()
            
            self._facilities = []
            for _, r in fac_df.iterrows():
                iso_code = str(r['iso3_country'])
                country_name = COUNTRY_MAPPING.get(iso_code, iso_code)
                self._facilities.append({
                    "source_id": int(r['source_id']),
                    "source_name": str(r['source_name']),
                    "iso3_country": iso_code,
                    "country_name": country_name,
                    "source_type": str(r['source_type']),
                    "sector": str(r['sector']),
                    "subsector": str(r['subsector']),
                    "lat": float(r['lat']),
                    "lon": float(r['lon'])
                })
                
            # Alphabetically sorted unique countries
            unique_iso_codes = sorted(df['iso3_country'].dropna().unique().tolist())
            self._countries = [
                {"code": code, "name": COUNTRY_MAPPING.get(code, code)}
                for code in unique_iso_codes
            ]
            
            # Distinct source types
            self._source_types = sorted(df['source_type'].dropna().unique().tolist())
            
            # Distinct sectors
            self._sectors = sorted(df['sector'].dropna().unique().tolist())
            
            # Distinct subsectors
            self._subsectors = sorted(df['subsector'].dropna().unique().tolist())
            
            # Gases: use standard gases requested by user and supported by mapping
            self._gases = ["CO2", "CH4", "N2O"]
            
            logger.info(f"Loaded {len(self._facilities)} unique facilities, {len(self._countries)} countries.")
            self._initialized = True
        except Exception as e:
            logger.exception(f"Error loading Climate TRACE dataset: {e}")
            self._facilities = []
            self._countries = []
            self._source_types = []
            self._sectors = []
            self._subsectors = []
            self._gases = ["CO2", "CH4", "N2O"]
            self._initialized = True

    def get_facilities(self) -> List[Dict[str, Any]]:
        self.initialize()
        return self._facilities

    def get_countries(self) -> List[Dict[str, Any]]:
        self.initialize()
        return self._countries

    def get_source_types(self) -> List[str]:
        self.initialize()
        return self._source_types

    def get_sectors(self) -> List[str]:
        self.initialize()
        return self._sectors

    def get_subsectors(self) -> List[str]:
        self.initialize()
        return self._subsectors

    def get_gases(self) -> List[str]:
        return self._gases

    def _load_history(self):
        """Lazily load the preprocessed per-facility time series (lags/rolling means already
        computed by preprocess.py) so real historical context can be looked up per facility."""
        if getattr(self, "_history_df", None) is not None:
            return

        base_dir = os.path.abspath(os.path.dirname(__file__))
        candidates = [
            os.path.abspath(os.path.join(base_dir, "../../../preprocess/iron_steel_preprocessed.csv")),
            os.path.abspath(os.path.join(base_dir, "../../preprocess/iron_steel_preprocessed.csv")),
        ]
        path = next((p for p in candidates if os.path.exists(p)), None)
        if not path:
            logger.warning("iron_steel_preprocessed.csv not found; facility history lookup disabled.")
            self._history_df = pd.DataFrame()
            return

        logger.info(f"Loading preprocessed facility history from: {path}")
        df = pd.read_csv(path)
        df = df.sort_values(by=["source_id", "year", "month"])
        self._history_df = df

    def get_facility_history(self, source_id: int) -> Dict[str, Any] | None:
        """
        Return the most recent known feature row for a facility (its real emission_lag_*,
        rolling_mean_*, emissions_factor, units, and last observed year/month/quarter),
        advanced by one month so the lookup represents "context for forecasting the next
        period" rather than re-stating an already-known period.

        Returns None if the facility has no history available (caller should fall back to
        dataset-wide defaults).
        """
        self._load_history()
        if self._history_df.empty:
            return None

        rows = self._history_df[self._history_df["source_id"] == source_id]
        if rows.empty:
            return None

        last = rows.iloc[-1]
        month = int(last["month"]) + 1
        year = int(last["year"])
        if month > 12:
            month = 1
            year += 1
        quarter = (month - 1) // 3 + 1

        return {
            "activity_units": int(last["activity_units"]),
            "emissions_factor": float(last["emissions_factor"]),
            "emissions_factor_units": int(last["emissions_factor_units"]),
            "capacity_units": int(last["capacity_units"]),
            "year": year,
            "month": month,
            "quarter": quarter,
            "emission_lag_1": float(last["emission_lag_1"]),
            "emission_lag_3": float(last["emission_lag_3"]),
            "emission_lag_6": float(last["emission_lag_6"]),
            "emission_lag_12": float(last["emission_lag_12"]),
            "rolling_mean_3": float(last["rolling_mean_3"]),
            "rolling_mean_6": float(last["rolling_mean_6"]),
            "rolling_mean_12": float(last["rolling_mean_12"]),
        }

dataset_service = DatasetService()
