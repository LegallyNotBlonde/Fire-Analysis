from flask import Flask, jsonify, request, render_template
import sqlite3
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('DB/fire_data.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/data', methods=['GET'])
def get_data():
    year = request.args.get('year')
    metric = request.args.get('metric')  # 'acres' or 'economic_damage'

    conn = get_db_connection()

    if metric == 'acres':
        query = '''SELECT c.County, SUM(f.Acres) as total_acres
                   FROM combined_data f
                   JOIN california_counties c ON f.county_up = c.county_up
                   WHERE f.Year = ?
                   GROUP BY c.County'''
    elif metric == 'economic_damage':
        query = '''SELECT c.County, SUM(e.Tot_Damage) as total_damage
                   FROM combined_data e
                   JOIN california_counties c ON e.county_up = c.county_up
                   WHERE e.Year = ?
                   GROUP BY c.County'''
    else:
        return jsonify({"error": "Invalid metric"}), 400

    data = conn.execute(query, (year,)).fetchall()
    conn.close()

    results = {row['County']: row['total_acres'] if metric == 'acres' else row['total_damage'] for row in data}
    return jsonify(results)



@app.route('/')
def index():
    mapbox_token = os.getenv('MAPBOX_TOKEN')
    return render_template('index.html', mapbox_token=mapbox_token)

if __name__ == '__main__':
    app.run(debug=True)
