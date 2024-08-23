import sqlite3
import pandas as pd

# Load the CSV files
counties_df = pd.read_csv('Resources/california_counties_forDB.csv')
summary_df = pd.read_csv('Outputs/merged_summary_dollar_data.csv')

# Create a SQLite database connection
conn = sqlite3.connect('FlaskTestTF/fire_data.db')
cursor = conn.cursor()

# Create the counties table
cursor.execute('''
CREATE TABLE IF NOT EXISTS counties (
    county_id INTEGER PRIMARY KEY AUTOINCREMENT,
    county_name TEXT NOT NULL,
    abbreviation TEXT
)
''')

# Create the fire_data table
cursor.execute('''
CREATE TABLE IF NOT EXISTS fire_data (
    fire_id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    county_name TEXT,
    acres REAL,
    strux_destr REAL,
    strux_dmgd REAL,
    deaths_ff REAL,
    deaths_civil REAL,
    duration REAL,
    unique_fire_days REAL,
    total_fires REAL,
    tot_damage REAL,
    county_id INTEGER,
    FOREIGN KEY (county_id) REFERENCES counties (county_id)
)
''')

# Insert data into the counties table
for index, row in counties_df.iterrows():
    cursor.execute('''
    INSERT INTO counties (county_name, abbreviation)
    VALUES (?, ?)
    ''', (row['County'], row['Abbreviation']))

# Commit the insertions
conn.commit()

# Create a dictionary to map county names to county_ids
cursor.execute('SELECT county_id, county_name FROM counties')
county_id_map = {row[1]: row[0] for row in cursor.fetchall()}

# Insert data into the fire_data table
for index, row in summary_df.iterrows():
    county_id = county_id_map.get(row['County'])
    cursor.execute('''
    INSERT INTO fire_data (year, county_name, acres, strux_destr, strux_dmgd, deaths_ff, deaths_civil, duration, unique_fire_days, total_fires, tot_damage, county_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        row['Year'], row['County'], row['Acres'], row['Strux_Destr'], row['Strux_Dmgd'],
        row['Deaths_FF'], row['Deaths_Civil'], row['Duration'], row['Unique_Fire_Days'], 
        row['Total_Fires'], row['Tot_Damage'], county_id
    ))

# Commit the insertions
conn.commit()

# Create an index for faster joins
cursor.execute('CREATE INDEX IF NOT EXISTS idx_fire_data_county_name ON fire_data (county_name)')

# Close the database connection
conn.close()

print("Database created and data populated successfully.")
