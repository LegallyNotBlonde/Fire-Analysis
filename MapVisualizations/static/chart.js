document.getElementById('year-dropdown').addEventListener('change', function() {
    const selectedYear = this.value;
    fetch(`/get_chart/${selectedYear}`)
        .then(response => response.json())
        .then(data => {
            vegaEmbed('#chart-fires', data.chart_fires);
            vegaEmbed('#chart-acres', data.chart_acres);
            vegaEmbed('#chart-duration', data.chart_duration);
            vegaEmbed('#chart-deaths', data.chart_deaths);

            // Update the total stats for the selected year
            updateCharts(data, selectedYear);
        })
        .catch(error => console.error('Error fetching chart data:', error));
});

// Trigger the first load
document.getElementById('year-dropdown').dispatchEvent(new Event('change'));

// Function to update the charts based on the selected year
function updateCharts(data, selectedYear) {
    // Filter data by the selected year
    const filteredData = data.filter(d => d.Year == selectedYear)[0];

    // Console log the filtered data to verify results
    console.log("Filtered Data:", filteredData);

    // Update key stats for the selected year
    const totalStatsDiv = d3.select("#total-stats");
    totalStatsDiv.html(`
        <p><strong>Total Fires This Year:</strong> ${filteredData.total_fires}</p>
        <p><strong>Total Acres Burned:</strong> ${parseFloat(filteredData.total_acres).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        <p><strong>Median Fire Duration:</strong> ${filteredData.median_yearly_duration}</p>
        <p><strong>Total Deaths:</strong> ${filteredData.total_deaths}</p>
        <p><strong>Total Financial Damage, $:</strong> ${parseFloat(filteredData.Tot_Damage).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
    `);
}
