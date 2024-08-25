from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
import os
import sqlite3
import geopandas as gpd

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    mapbox_token = os.getenv('MAPBOX_TOKEN')
    return render_template('index.html', mapbox_token=mapbox_token)

def get_fire_data():
    conn = sqlite3.connect('fire_data.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM fires')
    data = cursor.fetchall()
    conn.close()
    return data

@app.route('/api/fire-data')
def fire_data():
    data = get_fire_data()
    return jsonify(data)

@app.route('/data/county_boundaries')
def county_boundaries():
    # Load the Shapefile
    gdf = gpd.read_file('static/Data/California_County_Boundaries.geojson')
    
    # Add a new column with uppercase county names
    gdf['name_up'] = gdf['county_name'].str.upper()
    
    # Convert the data to GeoJSON
    geojson_data = gdf.to_json()
    
    # Return the GeoJSON data
    return jsonify(geojson_data)

@app.route('/api/heatmap')
def heatmap():
    metric = request.args.get('metric')
    conn = sqlite3.connect('fire_data.db')
    cursor = conn.cursor()
    query = f"SELECT county_upper, {metric} FROM fires"
    cursor.execute(query)
    data = cursor.fetchall()
    conn.close()

    # Create a GeoJSON structure
    gdf = gpd.read_file('static/Data/California_County_Boundaries.geojson')
    gdf['metric_value'] = gdf['county_upper'].map(dict(data))

    geojson_data = gdf.to_json()
    return jsonify(geojson_data)

if __name__ == '__main__':
    app.run(debug=True)
