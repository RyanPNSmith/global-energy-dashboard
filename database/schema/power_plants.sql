-- Schema for storing global power plant data
-- Source columns derived from database/seeds/global_power_plant_database.csv

CREATE TABLE IF NOT EXISTS power_plants (
    gppd_idnr                TEXT PRIMARY KEY,
    country                  CHAR(3) NOT NULL,
    country_long             TEXT,
    name                     TEXT NOT NULL,
    capacity_mw              DOUBLE PRECISION,
    latitude                 DOUBLE PRECISION,
    longitude                DOUBLE PRECISION,
    primary_fuel             TEXT,
    other_fuel1              TEXT,
    other_fuel2              TEXT,
    other_fuel3              TEXT,
    commissioning_year       SMALLINT,
    owner                    TEXT,
    source                   TEXT,
    url                      TEXT,
    geolocation_source       TEXT,
    wepp_id                  TEXT,
    year_of_capacity_data    SMALLINT,
    generation_gwh_2013      DOUBLE PRECISION,
    generation_gwh_2014      DOUBLE PRECISION,
    generation_gwh_2015      DOUBLE PRECISION,
    generation_gwh_2016      DOUBLE PRECISION,
    generation_gwh_2017      DOUBLE PRECISION,
    generation_gwh_2018      DOUBLE PRECISION,
    generation_gwh_2019      DOUBLE PRECISION,
    generation_data_source   TEXT,
    estimated_generation_gwh_2013 DOUBLE PRECISION,
    estimated_generation_gwh_2014 DOUBLE PRECISION,
    estimated_generation_gwh_2015 DOUBLE PRECISION,
    estimated_generation_gwh_2016 DOUBLE PRECISION,
    estimated_generation_gwh_2017 DOUBLE PRECISION,
    estimated_generation_note_2013 TEXT,
    estimated_generation_note_2014 TEXT,
    estimated_generation_note_2015 TEXT,
    estimated_generation_note_2016 TEXT,
    estimated_generation_note_2017 TEXT,
    UNIQUE (country, name)
);

-- Indexes to speed up common queries (matching live DB naming)
CREATE INDEX IF NOT EXISTS idx_power_plants_country ON power_plants (country);
CREATE INDEX IF NOT EXISTS idx_power_plants_country_long ON power_plants (country_long);
CREATE INDEX IF NOT EXISTS idx_power_plants_primary_fuel ON power_plants (primary_fuel);
CREATE INDEX IF NOT EXISTS idx_power_plants_lat_lon ON power_plants (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_power_plants_capacity ON power_plants (capacity_mw);

-- Optional: Index for time series queries (multiple generation year columns)
CREATE INDEX IF NOT EXISTS idx_power_plants_generation_years
    ON power_plants (
        generation_gwh_2013,
        generation_gwh_2014,
        generation_gwh_2015,
        generation_gwh_2016,
        generation_gwh_2017,
        generation_gwh_2018,
        generation_gwh_2019
    );
