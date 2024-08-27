from flask import Flask, render_template, jsonify
import altair as alt
import pandas as pd

app = Flask(__name__)

# Load the CSV data
monthly_data = pd.read_csv('static/monthly_stats.csv')

def create_chart(selected_year):
    # Filter data for the selected year
    monthly_filtered_data = monthly_data[monthly_data['Year'] == selected_year]

    # Total Fires by Month
    chart_fires = alt.Chart(monthly_filtered_data).mark_bar(color='brown').encode(
        x=alt.X('Month:O', title='Month #'),
        y=alt.Y('total_fires:Q', title='Total Fires')
    ).properties(
        title=f'Total Fires Each Month in {selected_year}'
    )

    # Total Acres Burned by Month
    chart_acres = alt.Chart(monthly_filtered_data).mark_bar(color='black').encode(
        x=alt.X('Month:O', title='Month #'),
        y=alt.Y('total_acres:Q', title='Total Acres Burned')
    ).properties(
        title=f'Total Acres Burned by Month in {selected_year}'
    )

    # Median Fire Duration by Month
    chart_duration = alt.Chart(monthly_filtered_data).mark_bar(color='orange').encode(
        x=alt.X('Month:O', title='Month #'),
        y=alt.Y('median_monthly_duration:Q', title='Median Fire Duration')
    ).properties(
        title=f'Median Fire Duration in {selected_year}'
    )

    # Total Deaths by Month
    chart_deaths = alt.Chart(monthly_filtered_data).mark_bar(color='red').encode(
        x=alt.X('Month:O', title='Month #'),
        y=alt.Y('total_deaths:Q', title='Total Deaths')
    ).properties(
        title=f'Total Deaths by Month in {selected_year}'
    )

    return chart_fires, chart_acres, chart_duration, chart_deaths

@app.route('/')
def index():
    return render_template('chartindex.html')

@app.route('/get_chart/<int:selected_year>', methods=['GET'])
def get_chart(selected_year):
    chart_fires, chart_acres, chart_duration, chart_deaths = create_chart(selected_year)
    
    # Convert charts to JSON to be rendered with Altair's vega-lite library in the frontend
    return jsonify({
        'chart_fires': chart_fires.to_json(),
        'chart_acres': chart_acres.to_json(),
        'chart_duration': chart_duration.to_json(),
        'chart_deaths': chart_deaths.to_json()
    })

if __name__ == '__main__':
    app.run(debug=True)
