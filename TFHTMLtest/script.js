// Initialize the map
var map = L.map('map').setView([37.7749, -122.4194], 6);

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Load CSV data and calculate total deaths
Papa.parse('summary_totals_by_county.csv', {
    download: true,
    header: true,
    complete: function(results) {
        var csvData = results.data;
        console.log("CSV Data Loaded:", csvData); // Debugging log

        // Calculate total deaths for each entry in the CSV data
        csvData.forEach(function(entry) {
            let deathsFF = parseFloat(entry.Deaths_FF) || 0;
            let deathsCivil = parseFloat(entry.Deaths_Civil) || 0;
            entry.total_deaths = deathsFF + deathsCivil;
            console.log(`Total deaths for ${entry.County}: ${entry.total_deaths}`); // Debugging log
        });

        // Fetch GeoJSON data for California counties
        fetch('California_County_Boundaries.geojson')
            .then(response => response.json())
            .then(geojsonData => {
                console.log("GeoJSON Data Loaded:", geojsonData); // Debugging log
                processGeoJSON(geojsonData, csvData);
            });
    }
});

// Process GeoJSON data and link with CSV
function processGeoJSON(geojsonData, csvData) {
    // Map CSV data to GeoJSON features
    geojsonData.features.forEach(function(feature) {
        var countyName = feature.properties.COUNTY_NAME; // Use the correct property name

        // Ensure that entry.County exists and is not undefined
        var csvEntry = csvData.find(entry => entry.County && countyName && entry.County.trim() === countyName.trim());

        if (csvEntry) {
            // If there's a matching CSV entry, set the properties based on CSV data
            feature.properties.acres = parseFloat(csvEntry.Acres) || 0; // Acres
            feature.properties.strut_dest = parseFloat(csvEntry.Strux_Destr) || 0; // Structures Destroyed
            feature.properties.strux_dmgd = parseFloat(csvEntry.Strux_Dmgd) || 0; // Structures Damaged
            feature.properties.total_deaths = csvEntry.total_deaths; // Total deaths calculated earlier
        } else {
            // If there's no matching CSV entry, set all properties to zero
            console.warn(`No data for ${countyName}, setting all values to 0.`);
            feature.properties.acres = 0;
            feature.properties.strut_dest = 0;
            feature.properties.strux_dmgd = 0;
            feature.properties.total_deaths = 0;
        }
    });

    // Initial map rendering
    renderMap(geojsonData);
}

var geoLayer; // Store the GeoJSON layer for updating

// Render the map
function renderMap(geojsonData) {
    geoLayer = L.geoJson(geojsonData, {
        style: function(feature) {
            return {
                fillColor: getColor(feature.properties.acres), // Default to Acres
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }
    }).addTo(map);
    console.log("Map rendered with geoLayer:", geoLayer); // Debugging log
}

// Event listener for the display button
document.getElementById('displayButton').addEventListener('click', function() {
    var dataType = document.getElementById('dataSelect').value;
    console.log("Selected Data Type:", dataType); // Debugging log

    // Ensure geoLayer is defined before trying to update the map
    if (geoLayer) {
        // Filter and display the map with the selected data
        updateMap(dataType);
    } else {
        console.error("geoLayer is not initialized."); // Debugging log
    }
});

// Update the map based on selected data type
function updateMap(dataType) {
    geoLayer.eachLayer(function(layer) {
        var value = layer.feature.properties[dataType];
        console.log("Updating Layer:", layer.feature.properties.COUNTY_NAME, "with value:", value); // Debugging log
        layer.setStyle({
            fillColor: getColor(value)
        });
    });
}

// Function to determine color based on data value
function getColor(value) {
    return value > 1000 ? '#800026' :
           value > 500  ? '#BD0026' :
           value > 200  ? '#E31A1C' :
           value > 100  ? '#FC4E2A' :
           value > 50   ? '#FD8D3C' :
           value > 20   ? '#FEB24C' :
           value > 10   ? '#FED976' :
                         '#FFEDA0';
}
