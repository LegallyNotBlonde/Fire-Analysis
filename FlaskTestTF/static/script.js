document.addEventListener('DOMContentLoaded', function() {
    // Populate counties dropdown
    fetch('/api/counties')
        .then(response => response.json())
        .then(data => {
            const countySelect = document.getElementById('county');
            data.forEach(county => {
                let option = document.createElement('option');
                option.value = county;
                option.text = county;
                countySelect.add(option);
            });
        });

    // Populate years dropdown
    fetch('/api/years')
        .then(response => response.json())
        .then(data => {
            const yearSelect = document.getElementById('year');
            data.forEach(year => {
                let option = document.createElement('option');
                option.value = year;
                option.text = year;
                yearSelect.add(option);
            });
        });
});

// Function to fetch data and update the map
function fetchData() {
    const county = document.getElementById('county').value;
    const year = document.getElementById('year').value;
    const metric = document.getElementById('metric').value;

    fetch(`/api/query?county=${county}&year=${year}&metric=${metric}`)
        .then(response => response.json())
        .then(data => {
            // Clear existing map layers
            map.eachLayer(layer => {
                if (layer.options && layer.options.pane !== 'tilePane') {
                    map.removeLayer(layer);
                }
            });

            // Add new data to the map
            data.forEach(item => {
                const marker = L.marker([item.lat, item.lng]).addTo(map);
                marker.bindPopup(`<b>${item.county}</b><br>${metric}: ${item.value}`).openPopup();
            });
        });
}

// Initialize the map
const map = L.map('choropleth').setView([37.7749, -122.4194], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
