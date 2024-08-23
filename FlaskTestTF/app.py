from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

def query_database(county=None, year=None, metric=None):
    conn = sqlite3.connect('fire_data.db')
    cursor = conn.cursor()

    base_query = "SELECT county_name, {}, lat, lng FROM fire_data WHERE 1=1".format(metric)
    
    if county:
        base_query += " AND county_name = ?"
    if year:
        base_query += " AND year = ?"

    cursor.execute(base_query, tuple(filter(None, [county, year])))
    results = cursor.fetchall()
    conn.close()
    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/counties')
def get_counties():
    conn = sqlite3.connect('fire_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT county_name FROM fire_data ORDER BY county_name")
    counties = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(counties)

@app.route('/api/years')
def get_years():
    conn = sqlite3.connect('fire_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT year FROM fire_data ORDER BY year")
    years = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(years)

@app.route('/api/query')
def query():
    county = request.args.get('county')
    year = request.args.get('year')
    metric = request.args.get('metric')

    results = query_database(county, year, metric)
    
    data = [
        {"county": row[0], "value": row[1], "lat": row[2], "lng": row[3]}
        for row in results
    ]

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
