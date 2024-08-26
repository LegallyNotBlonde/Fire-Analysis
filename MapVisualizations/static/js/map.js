// map.js

// The Mapbox token is dynamically passed from the HTML template
mapboxgl.accessToken = mapboxToken;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Mapbox map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11', // Simplified style for testing
        center: [-120.234, 37.868], // Centered on California
        zoom: 5
    });

    map.on('load', function () {
        // Load the GeoJSON data
        fetch('static/Data/California_County_Boundaries.geojson')
            .then(response => response.json())
            .then(geojson => {
                console.log('Loaded GeoJSON Data:', geojson); // Log the loaded GeoJSON data

                map.addSource('counties', {
                    type: 'geojson',
                    data: geojson // Use the loaded GeoJSON object
                });

                map.addLayer({
                    'id': 'county-heatmap',
                    'type': 'fill',
                    'source': 'counties',
                    'layout': {},
                    'paint': {
                        'fill-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'value'],
                            0, '#ffffcc',
                            100, '#ffeda0',
                            200, '#feb24c',
                            300, '#f03b20',
                            400, '#bd0026'
                        ],
                        'fill-opacity': 0.75
                    }
                });

                // Initial load with default values
                updateMap(2020, 'acres');
            })
            .catch(error => {
                console.error('Error loading GeoJSON data:', error);
            });
    });

    // Add event listener to the "Update Map" button
    document.getElementById('update-map').addEventListener('click', function() {
        const year = document.getElementById('year-select').value;
        const metric = document.getElementById('metric-select').value;
        updateMap(year, metric);
    });

// Function to get data and update the map
async function updateMap(year, metric) {
    // Fetch data from the Flask API
    const response = await fetch(`/api/data?year=${year}&metric=${metric}`);
    const data = await response.json();

    // Get the source and update its data
    const source = map.getSource('counties');
    if (!source) {
        console.error('GeoJSON source not found');
        return;
    }

    const counties = source._data;
    if (!counties || !counties.features) {
        console.error('GeoJSON data is not available');
        return;
    }

    // Debugging: Log the API data to the console
    console.log('API Data:', data);

    // Loop through each feature and update its 'value' property
    counties.features.forEach(function (feature) {
        const countyName = feature.properties.COUNTY_NAME.toUpperCase();  // Normalize to uppercase
        let value = data[countyName];  // Fetch the value from API data

        if (value == null) {  // Check if the value is null or undefined
            console.warn(`Value for ${countyName} is null or undefined. Defaulting to 0.`);
            value = 0;
        }

        feature.properties.value = value;
    });

    // Update the map source with the new data
    source.setData(counties);
}

});
