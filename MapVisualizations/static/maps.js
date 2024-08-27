document.addEventListener("DOMContentLoaded", function () {
    // Initialize the Leaflet map centered on California with a zoom level of 6
    var map = L.map('map').setView([37.54, -118.48482082611778], 6);

    // Add a tile layer from OpenStreetMap with attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Variable to hold the county GeoJSON data, initialized as null
    var countiesGeoJson = null;

    // Function to determine the color of the map polygons based on the metric value and maximum value
    function getColor(d, maxValue) {
        if (d === 0) {
            return '#FFFFFF'; // White color for zero values
        }
        // Return different shades based on the value as a percentage of the maximum value
        return d > 0 && d <= maxValue * 0.01 ? '#FFEDA0' :
               d > maxValue * 0.01 && d <= maxValue * 0.1 ? '#FEB24C' :
               d > maxValue * 0.1 && d <= maxValue * 0.3 ? '#FD8D3C' :
               d > maxValue * 0.3 && d <= maxValue * 0.5 ? '#FC4E2A' :
               d > maxValue * 0.5 && d <= maxValue * 0.7 ? '#E31A1C' :
               d > maxValue * 0.7 && d <= maxValue * 0.9 ? '#BD0026' :
               d > maxValue * 0.9 ? '#800026' :
                                    '#FFEDA0'; // Default color for any other values
    }

    // Function to render the map using GeoJSON data
    function renderMap(geojsonData) {
        var geojson = JSON.parse(geojsonData); // Parse the GeoJSON data
        countiesGeoJson = geojson;  // Store GeoJSON data for later use
    
        populateCountyDropdown(geojson); // Populate the county dropdown menu
        var maxValue = Math.max(...geojson.features.map(f => f.properties.value)); // Find the maximum value in the dataset
    
        // Remove the existing GeoJSON layer if it exists
        if (window.currentLayer) {
            map.removeLayer(window.currentLayer);
        }
    
        // Add the new GeoJSON layer to the map with dynamic styling
        window.currentLayer = L.geoJSON(geojson, {
            style: function(feature) {
                return {
                    fillColor: getColor(feature.properties.value, maxValue), // Color the polygons based on the value
                    fillOpacity: 0.7,
                    color: '#000000', // Black border color for the polygons
                    weight: 2
                };
            },
            // Attach an event listener to each polygon for when it's clicked
            onEachFeature: function(feature, layer) {
                layer.on('click', function() {
                    var countyName = feature.properties.County; // Get the county name
                    fetchCountyData(countyName); // Fetch and display data for the selected county
                });
            }
        }).addTo(map);
    
        updateLegend(maxValue, window.currentMetric); // Update the legend with the current metric
    
        addFirePerimeters(window.currentYear); // Add the fire perimeters layer for the current year
    }

    // Function to update the map based on the selected metric and year
    function updateMap(metric, year) {
        window.currentYear = year; // Store the current year for later use
        window.currentMetric = metric; // Store the current metric for later use
    
        // Fetch the GeoJSON data for the selected metric and year
        fetch(`/data/${metric}/${year}`)
            .then(response => response.json())
            .then(geojsonData => {
                renderMap(geojsonData); // Render the map with the fetched data
            })
            .catch(error => console.error('Error fetching main data:', error));
    }

    // Function to populate the county dropdown menu with county names from the GeoJSON data
    function populateCountyDropdown(geojson) {
        var countySelect = document.getElementById('county-select');
        countySelect.innerHTML = '<option value="">Select County</option>'; // Reset the dropdown menu

        geojson.features.forEach(function(feature) {
            var countyName = feature.properties.County; // Get the county name
            var option = document.createElement('option');
            option.value = countyName; // Set the option value to the county name
            option.textContent = countyName; // Set the option text to the county name
            countySelect.appendChild(option); // Add the option to the dropdown menu
        });
    }

    // Event listener for the county dropdown to zoom to the selected county
    document.getElementById('county-select').addEventListener('change', function() {
        var selectedCounty = this.value; // Get the selected county name

        // If a county is selected and GeoJSON data is available, find the county and zoom to it
        if (selectedCounty && countiesGeoJson) {
            var countyFeature = countiesGeoJson.features.find(function(feature) {
                return feature.properties.County === selectedCounty;
            });

            if (countyFeature) {
                var bounds = L.geoJSON(countyFeature).getBounds(); // Get the bounds of the selected county
                map.fitBounds(bounds); // Zoom the map to the selected county's bounds
            }
        }
    });

    // Event listener for the "Full Extent" button to reset the map view to California
    document.getElementById('full-extent').addEventListener('click', function() {
        map.setView([37.7749, -122.4194], 6); // Reset the map view to California
    });

    // Function to fetch and display data for a selected county
    function fetchCountyData(countyName) {
        toggleTableVisibility(true); // Show the table and adjust the map
    
        fetch(`/county_data/${countyName}`)
            .then(response => response.json())
            .then(data => {
                console.log(data); // Inspect the returned data here
                displayCountyData(countyName, data);
            })
            .catch(error => console.error('Error fetching county data:', error));
    }
    

    // Function to display the fetched data for a selected county in the table
    function displayCountyData(countyName, data) {
        // Update the table title with the selected county name
        var tableTitle = document.getElementById("table-title");
        tableTitle.textContent = `County: ${countyName}`;
        
        var tableBody = document.querySelector("#data-table tbody");
        tableBody.innerHTML = ''; // Clear any existing data in the table
    
        // Check if the fetched data is valid and not empty
        if (!data || data.length === 0) {
            console.error('No data available for this county.');
            tableBody.innerHTML = '<tr><td colspan="8">No data available</td></tr>'; // Display a "No data available" message
            return;
        }
    
        // Populate the table with the fetched data
        data.forEach(function(row) {
            var tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${row.Year || 'N/A'}</td>
            <td>${row["Fire Name"] || 'N/A'}</td>
            <td>${row.Acres || 0}</td>
            <td>${row.Strux_Destr || 0}</td>
            <td>${row.Strux_Dmgd || 0}</td>
            <td>${row.Deaths_FF || 0}</td>
            <td>${row.Deaths_Civil || 0}</td>
            <td>${row.Duration || 'N/A'}</td>
            `;
            tableBody.appendChild(tr); // Add the row to the table
        });
    }

    function toggleTableVisibility(isVisible) {
        var dataTableContainer = document.getElementById('data-table-container');
        var mapElement = document.getElementById('map');
    
        if (isVisible) {
            dataTableContainer.style.display = 'block';
            mapElement.style.bottom = '300px';  // Adjust the map to make space for the table
        } else {
            dataTableContainer.style.display = 'none';
            mapElement.style.bottom = '0';  // Remove the bottom space when the table is hidden
        }
    }
    
    // showing/hiding the table with this function
    document.addEventListener('click', function (event) {
        var dataTableContainer = document.getElementById('data-table-container');
        var map = document.getElementById('map');
    
        if (!dataTableContainer.contains(event.target) && !map.contains(event.target)) {
            toggleTableVisibility(false);  // Hide the table and adjust the map
        }
    });
    

    // Create the legend control and add it to the map at the bottom-right position
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'); // Create a div for the legend
        div.innerHTML = ''; // Initially empty, will be populated dynamically
        return div;
    };

    legend.addTo(map); // Add the legend to the map

    // Function to update the legend based on the selected metric and maximum value
    function updateLegend(maxValue, metric) {
        var legendDiv = document.querySelector('.info.legend');
        var labels = [];
        var legendTitle = document.createElement('div');
        legendTitle.style.fontWeight = 'bold'; // Make the legend title bold
        legendTitle.style.marginBottom = '10px'; // Add some margin below the legend title
        legendTitle.textContent = metric.replace(/_/g, ' ').toUpperCase(); // Convert the metric name to a title
        legendDiv.innerHTML = ''; // Clear any existing content in the legend
        legendDiv.appendChild(legendTitle); // Add the legend title
    
        // Special case for 0 values with an explicit label
        labels.push('<i style="background:#FFFFFF; border: 1px solid black;"></i> 0');
    
        var step = Math.max(maxValue / 7, 1); // Determine the step size for the legend, with a minimum of 1
        var grades = [];
        for (var i = 0; i <= maxValue; i += step) {
            grades.push(i); // Generate the grades based on the step size
        }
    
        // Ensure the last grade is equal to the maximum value
        if (grades[grades.length - 1] < maxValue) {
            grades.push(maxValue);
        }
    
        // Loop through the grades and create labels with color patches
        for (var i = 1; i < grades.length; i++) {
            var from = grades[i - 1];
            var to = grades[i];
    
            labels.push(
                '<i style="background:' + getColor(from + 1, maxValue) + '; border: 1px solid black; width: 18px; height: 18px; margin-right: 8px; vertical-align: middle; line-height: 18px;"></i> ' +
                formatNumber(from) + (to ? '&ndash;' + formatNumber(to) : '+')
            );
        }
    
        // Add a special entry for fire perimeters
        labels.push('<i style="background:red; border: 1px solid black; width: 18px; height: 18px; margin-right: 8px; vertical-align: middle; line-height: 18px;"></i> Fire Perimeters');
    
        legendDiv.innerHTML += labels.join('<br>'); // Add the labels to the legend
    }

    // Helper function to format numbers with commas and round them
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'; // Format numbers in millions with one decimal
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'; // Format numbers in thousands with one decimal
        } else {
            return Math.round(num).toLocaleString(); // Format smaller numbers with commas
        }
    }

    // Function to add fire perimeter data as a layer on the map
    function addFirePerimeters(year) {
        // ArcGIS REST service URL to fetch fire perimeter data for the selected year
        const url = `https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Fire_Perimeters/FeatureServer/2/query?outFields=*&where=YEAR_=${year}%20AND%20YEAR_%20>=2008%20AND%20YEAR_%20<=2022&f=geojson`;
    
        fetch(url)
            .then(response => response.json())
            .then(fireGeojson => {
                // Check if any fire perimeter data is available for the selected year
                if (!fireGeojson || !fireGeojson.features || fireGeojson.features.length === 0) {
                    console.warn(`No fire perimeters data available for year ${year}.`);
                    return; // Exit if no data is available
                }
    
                // Remove the existing fire perimeters layer if it exists
                if (window.firePerimetersLayer) {
                    map.removeLayer(window.firePerimetersLayer);
                }
    
                // Add the new fire perimeters layer to the map with a red outline
                window.firePerimetersLayer = L.geoJSON(fireGeojson, {
                    style: {
                        color: 'red', // Set the color for the fire perimeters
                        weight: 2,
                        opacity: 0.8
                    },
                    onEachFeature: function (feature, layer) {
                        // Helper function to format dates to YYYY-MM-DD
                        const formatDate = (dateString) => {
                            if (!dateString) return 'N/A';
                            const date = new Date(dateString);
                            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        };
    
                        // Bind a popup to each fire perimeter feature with relevant information
                        layer.on('click', function () {
                            var popupContent = `
                                <strong>Fire Name:</strong> ${feature.properties.FIRE_NAME || 'N/A'}<br>
                                <strong>Year:</strong> ${feature.properties.YEAR_ || 'N/A'}<br>
                                <strong>State:</strong> ${feature.properties.STATE || 'N/A'}<br>
                                <strong>Agency:</strong> ${feature.properties.AGENCY || 'N/A'}<br>
                                <strong>Alarm Date:</strong> ${formatDate(feature.properties.ALARM_DATE)}<br>
                                <strong>Containment Date:</strong> ${formatDate(feature.properties.CONT_DATE)}<br>
                                <strong>Cause:</strong> ${feature.properties.CAUSE || 'N/A'}
                            `;
                            layer.bindPopup(popupContent).openPopup(); // Display the popup on click
                        });
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Error fetching fire perimeters:', error));
    }

    // Initial load of the map with a default metric (total acres) and year (2020)
    updateMap('total_acres', 2020);

    // Event listener for the "Update Map" button to refresh the map based on selected metric and year
    document.getElementById('update-map').addEventListener('click', function () {
        var selectedMetric = document.getElementById('metric-select').value; // Get the selected metric
        var selectedYear = document.getElementById('year-select').value; // Get the selected year
        updateMap(selectedMetric, selectedYear); // Update the map with the new selection
    });
});
