document.addEventListener("DOMContentLoaded", function () {
    // Initialize the Leaflet map
    var map = L.map('map').setView([37.7749, -122.4194], 6); // Centered on California

    // Add a tile layer to the map (using OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Function to get color based on metric value and maximum value
    function getColor(d, maxValue) {
        return d > maxValue * 0.9 ? '#800026' :
               d > maxValue * 0.7 ? '#BD0026' :
               d > maxValue * 0.5 ? '#E31A1C' :
               d > maxValue * 0.3 ? '#FC4E2A' :
               d > maxValue * 0.1 ? '#FD8D3C' :
               d > maxValue * 0.01 ? '#FEB24C' :
                                     '#FFEDA0';
    }

    // Function to render the GeoJSON data on the map
    function renderMap(geojsonData) {
        var geojson = JSON.parse(geojsonData);

        // Determine the maximum value in the dataset
        var maxValue = Math.max(...geojson.features.map(f => f.properties.value));

        console.log("Maximum Value:", maxValue);

        // Remove the existing layers if they exist
        if (window.currentLayer) {
            map.removeLayer(window.currentLayer);
        }

        // Add the new GeoJSON layer with heatmap styling based on dynamic color scale
        window.currentLayer = L.geoJSON(geojson, {
            style: function(feature) {
                return {
                    fillColor: getColor(feature.properties.value, maxValue), // Dynamic heatmap color
                    fillOpacity: 0.7,
                    color: '#000000', // Black border color
                    weight: 2
                };
            }
        }).addTo(map);
    }

    // Function to update the map based on selected metric and year
    function updateMap(metric, year) {
        // Fetch the GeoJSON data from the Flask server
        fetch(`/data/${metric}/${year}`)
            .then(response => response.json())
            .then(geojsonData => {
                renderMap(geojsonData);
            });
    }

    // Initial load of the map with a default metric and year
    updateMap('total_acres', 2020);

    // Event listener for the Update Map button
    document.getElementById('update-map').addEventListener('click', function () {
        var selectedMetric = document.getElementById('metric-select').value;
        var selectedYear = document.getElementById('year-select').value;
        updateMap(selectedMetric, selectedYear);
    });
});
