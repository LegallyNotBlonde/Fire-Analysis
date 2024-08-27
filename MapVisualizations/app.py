from flask import Flask, render_template, jsonify
import sqlite3
import pandas as pd
import os
import geopandas as gpd

app = Flask(__name__)

# Paths to your SQLite database and Shapefile
DATABASE = 'DB/fire_data.sqlite'
SHAPEFILE = 'Data/ca_counties/CA_Counties.shp'


# Helper function to query the database
def query_db(query):
    conn = sqlite3.connect(DATABASE)
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chartsindex.html')
def charts():
    return render_template('chartsindex.html')

@app.route('/data/<metric>/<int:year>')
def data(metric, year):
    metrics_mapping = {
        'total_acres': 'SUM(Acres)',
        'total_deaths': 'SUM(Deaths_FF + Deaths_Civil)',
        'total_damaged': 'SUM(Strux_Destr + Strux_Dmgd)',
        'total_damages': 'SUM(Tot_Damage)',  # Assuming Tot_Damage is from the extracted table
        'active_fire_days': 'SUM(Unique_Fire_Days)'  # New metric from the unique_fire_days table
    }

    # Check if the selected metric requires querying a specific table
    if metric == 'total_damages':
        # Query the 'extracted' table for 'total_damages'
        sql_query = f"""
        SELECT County, {metrics_mapping[metric]} AS value
        FROM extracted
        WHERE Year = {year}
        GROUP BY County;
        """
    elif metric == 'active_fire_days':
        # Query the 'unique_fire_days' table for 'active_fire_days'
        sql_query = f"""
        SELECT County, {metrics_mapping[metric]} AS value
        FROM unique_fire_days
        WHERE Year = {year}
        GROUP BY County;
        """
    elif metric in metrics_mapping:
        # Query the 'fires' table for all other valid metrics
        sql_query = f"""
        SELECT County, {metrics_mapping[metric]} AS value
        FROM fires
        WHERE Year = {year}
        GROUP BY County;
        """
    else:
        return jsonify({"error": "Invalid metric"}), 400


    # Query the database
    data = query_db(sql_query)

    # Save the summary data to a CSV file (for debugging or processing purposes)
    csv_file = 'summary_data.csv'
    data.to_csv(csv_file, index=False)
    
    # Load the county boundaries from the shapefile
    counties_gdf = gpd.read_file(SHAPEFILE)

    # Load the summary data from the CSV file
    summary_df = pd.read_csv(csv_file)

    # Rename 'NAME' to 'County' in the shapefile GeoDataFrame
    counties_gdf = counties_gdf.rename(columns={'NAME': 'County'})

    # Merge the GeoDataFrame with the summary data
    counties_gdf = counties_gdf.merge(summary_df, on='County', how='left')

    # Replace NaN with 0 (for counties with no data)
    counties_gdf['value'] = counties_gdf['value'].fillna(0)
    
     # Ensure CRS is correct
    if counties_gdf.crs != 'EPSG:4326':
        counties_gdf = counties_gdf.to_crs('EPSG:4326')

    # Convert to GeoJSON
    geojson_data = counties_gdf.to_json()

    return jsonify(geojson_data)

@app.route('/county_data/<county_name>')
def county_data(county_name):
    # Query the fires table for all data related to the selected county
    sql_query = f"""
    SELECT *
    FROM fires
    WHERE County = '{county_name}';
    """
    data = query_db(sql_query)

    # Convert the data to JSON format
    data_json = data.to_dict(orient='records')

    return jsonify(data_json)


@app.route('/draw_counties')
def draw_counties():
    counties_gdf = gpd.read_file(SHAPEFILE)
    return jsonify(counties_gdf.to_json())

if __name__ == '__main__':
    app.run(debug=True)