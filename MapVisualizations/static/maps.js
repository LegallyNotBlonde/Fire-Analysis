document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([37.7749, -122.4194], 6); // Centered on California

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Function to get color based on metric value and maximum value
    function getColor(d, maxValue) {
        if (d === 0) {
            return '#FFFFFF'; // White for zero values
        }
        return d > 0 && d <= maxValue * 0.01 ? '#FFEDA0' :
               d > maxValue * 0.01 && d <= maxValue * 0.1 ? '#FEB24C' :
               d > maxValue * 0.1 && d <= maxValue * 0.3 ? '#FD8D3C' :
               d > maxValue * 0.3 && d <= maxValue * 0.5 ? '#FC4E2A' :
               d > maxValue * 0.5 && d <= maxValue * 0.7 ? '#E31A1C' :
               d > maxValue * 0.7 && d <= maxValue * 0.9 ? '#BD0026' :
               d > maxValue * 0.9 ? '#800026' :
                                    '#FFEDA0'; // Default for any other values
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

        // Update the legend based on the maximum value
        updateLegend(maxValue);
    }

    // Function to update the map based on selected metric and year
    function updateMap(metric, year) {
        fetch(`/data/${metric}/${year}`)
            .then(response => response.json())
            .then(geojsonData => {
                renderMap(geojsonData);
            });
    }

    // Create the legend control and add it to the map
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = ''; // Initially empty, will be populated dynamically
        return div;
    };

    legend.addTo(map);

    function updateLegend(maxValue) {
        var legendDiv = document.querySelector('.info.legend');
        var labels = [];
    
        // Special case for 0 with explicit label
        labels.push('<i style="background:#FFFFFF; border: 1px solid black;"></i> 0');
    
        // Determine the appropriate step size
        var step = Math.max(maxValue / 7, 1); // Ensure a minimum step size of 1
    
        // Generate the grades based on the step size
        var grades = [];
        for (var i = 0; i <= maxValue; i += step) {
            grades.push(i);
        }
    
        // Handle the case where maxValue is less than the calculated last grade
        if (grades[grades.length - 1] < maxValue) {
            grades.push(maxValue);
        }
    
        // Loop through the grades and generate a label with a colored square for each interval
        for (var i = 1; i < grades.length; i++) {  // Start loop at 1 to skip 0
            var from = grades[i - 1];
            var to = grades[i];
    
            labels.push(
                '<i style="background:' + getColor(from + 1, maxValue) + '; border: 1px solid black;"></i> ' +
                formatNumber(from) + (to ? '&ndash;' + formatNumber(to) : '+'));
        }
    
        legendDiv.innerHTML = labels.join('<br>');
    }
    

    // Helper function to format numbers with commas and round them
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'; // Display in millions with one decimal
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'; // Display in thousands with one decimal
        } else {
            return Math.round(num).toLocaleString(); // Round smaller numbers
        }
    }

    // Initial load of the map with a default metric and year
    updateMap('total_acres', 2022);

    // Event listener for the Update Map button
    document.getElementById('update-map').addEventListener('click', function () {
        var selectedMetric = document.getElementById('metric-select').value;
        var selectedYear = document.getElementById('year-select').value;
        updateMap(selectedMetric, selectedYear);
    });
});
