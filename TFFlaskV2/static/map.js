document.addEventListener('DOMContentLoaded', function() {
    const map = new mapboxgl.Map({
        container: 'map',  // The ID of the HTML element to attach the map to
        style: 'mapbox://styles/tfregoso/cm08g4cub00m301pw615ogjgn',  // Your custom Mapbox style
        center: [-120.234, 37.868],  // Initial center [longitude, latitude]
        zoom: 5  // Initial zoom level
    });

    map.on('load', function () {
        // Load county boundaries
        map.addSource('counties', {
            'type': 'geojson',
            'data': '/static/Data/California_County_Boundaries.geojson' // Ensure this path is correct
        });

        map.addLayer({
            'id': 'county-boundaries',
            'type': 'line',
            'source': 'counties',
            'layout': {},
            'paint': {
                'line-color': '#ff0000',
                'line-width': 2
            }
        });

        // Load fire perimeters
        fetch('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters/FeatureServer/2/query?outFields=*&where=1%3D1&f=geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('fire-perimeters', {
                'type': 'geojson',
                'data': data
            });

            map.addLayer({
                'id': 'fire-perimeters-fill',
                'type': 'fill',
                'source': 'fire-perimeters',
                'layout': {},
                'paint': {
                    'fill-color': '#ff7800',
                    'fill-opacity': 0.7
                }
            }, 'county-boundaries');

            map.addLayer({
                'id': 'fire-perimeters-outline',
                'type': 'line',
                'source': 'fire-perimeters',
                'layout': {},
                'paint': {
                    'line-color': '#000000',
                    'line-width': 2
                }
            }, 'county-boundaries');
        })
        .catch(error => console.error('Error loading fire perimeter data:', error));

        // Add heatmap layer (initially empty)
        map.addLayer({
            'id': 'county-heatmap',
            'type': 'fill',
            'source': 'counties',  // Reuse the county source
            'layout': {},
            'paint': {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'metric_value'],
                    0, 'rgba(0, 0, 255, 0.1)',
                    100, 'rgba(255, 0, 0, 0.7)'
                ],
                'fill-opacity': 0.5
            }
        });
    });

    // Function to update the fire perimeters based on the selected year
    function updateFirePerimeters(year) {
        map.setFilter('fire-perimeters-fill', ['==', ['get', 'Year'], year]);
        map.setFilter('fire-perimeters-outline', ['==', ['get', 'Year'], year]);
    }

    // Toggle the visibility of fire perimeters
    document.getElementById('toggle-fire-perimeters').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('fire-perimeters-fill', 'visibility', visibility);
        map.setLayoutProperty('fire-perimeters-outline', 'visibility', visibility);
    });

    // Update fire perimeters when year changes
    document.getElementById('year').addEventListener('change', function(e) {
        const year = parseInt(e.target.value);
        updateFirePerimeters(year);
    });

    // Populate year dropdown dynamically
    fetch('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters/FeatureServer/2/query?outFields=Year&where=1%3D1&returnDistinctValues=true&f=json')
        .then(response => response.json())
        .then(data => {
            const years = data.features.map(feature => feature.attributes.Year);
            const yearDropdown = document.getElementById('year');
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.text = year;
                yearDropdown.add(option);
            });
        });

    // Handle metric selection and update heatmap
    document.getElementById('metric').addEventListener('change', function(e) {
        const metric = e.target.value;
        fetch(`/api/heatmap?metric=${metric}`)
            .then(response => response.json())
            .then(data => {
                const countySource = map.getSource('counties');
                if (countySource) {
                    data.features.forEach(feature => {
                        if (feature.properties.metric_value === null) {
                            feature.properties.metric_value = 0;  // Replace null with 0 or an appropriate default value
                        }
                    });
                    countySource.setData(data);
                } else {
                    console.error("County source not found");
                }
            })
            .catch(error => console.error("Error fetching heatmap data:", error));
    });
});
