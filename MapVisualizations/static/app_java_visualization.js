// Load the yearly statistics CSV file with D3.js
d3.csv('static/yearly_stats.csv').then(function(data) {
    // Populate dropdown with unique years
    const yearSelect = d3.select("#year-select");
    const uniqueYears = [...new Set(data.map(d => d.Year))];
    uniqueYears.forEach(year => {
        yearSelect.append("option").text(year).attr("value", year);
    });

    // Initial display with the first year in the list
    updateCharts(data, uniqueYears[0]);

    // Update charts when the year is selected
    yearSelect.on("change", function() {
        const selectedYear = this.value;
        updateCharts(data, selectedYear);
    });

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

        // Load the monthly statistics from CSV file with D3.js
        d3.csv('static/monthly_stats.csv').then(function(monthlyData) {
            const monthlyFilteredData = monthlyData.filter(d => d.Year == selectedYear);

            // Update Total Fires chart by Month
            const traceFires = {
                x: monthlyFilteredData.map(d => d.Month),
                y: monthlyFilteredData.map(d => d.total_fires),
                type: 'bar',
                name: 'Total Fires By Month',
                marker: { color: 'brown' }  // Set bar color 
            };
            const layoutFires = {
                title: `Total Fires Each Month in ${selectedYear}`,
                xaxis: { 
                    title: 'Month #',
                    titlefont: { size: 18 }  // Adjust this size as needed
                },
                yaxis: { 
                    title: 'Total Fires',
                    titlefont: { size: 18 }  // Adjust this size as needed
                }
            };
            Plotly.newPlot('chart-fires', [traceFires], layoutFires);

            // Update Total Acres chart by Month
            const traceAcres = {
                x: monthlyFilteredData.map(d => d.Month),
                y: monthlyFilteredData.map(d => d.total_acres),
                type: 'bar',
                name: 'Total Acres Burned By Month',
                marker: { color: 'black' }  // Set bar color 
            };
            const layoutAcres = {
                title: `Total Acres Burned by Month in ${selectedYear}`,
                xaxis: { 
                    title: 'Month #',
                    titlefont: { size: 18 }  // Adjust this size as needed
                },
                yaxis: { 
                    title: 'Total Acres',
                    titlefont: { size: 18 }  // Adjust this size as needed 
                }
            };
            Plotly.newPlot('chart-acres', [traceAcres], layoutAcres);

            // Update Median Fire Duration chart by Month
            const traceDuration = {
                x: monthlyFilteredData.map(d => d.Month),
                y: monthlyFilteredData.map(d => d.median_monthly_duration),
                type: 'bar',
                name: 'Median Fire Duration By Month',
                marker: { color: 'orange' }  // Set bar color 
            };
            const layoutDuration = {
                title: `Median Fire Duration in ${selectedYear}`,
                xaxis: { 
                    title: 'Month #',
                    titlefont: { size: 18 }  // Adjust this size as needed
                 },
                yaxis: { 
                    title: 'Median Fire Duration',
                    titlefont: { size: 18 }  // Adjust this size as needed
                 }
            };
            Plotly.newPlot('chart-duration', [traceDuration], layoutDuration);

            // Update Total Deaths chart by Month
            const traceDeaths = {
                x: monthlyFilteredData.map(d => d.Month),
                y: monthlyFilteredData.map(d => d.total_deaths),
                type: 'bar',
                name: 'Total Deaths by Month',
                marker: { color: 'red' }  // Set bar color 
            };
            const layoutDeaths = {
                title: `Total Deaths by Month in ${selectedYear}`,
                xaxis: { 
                    title: 'Month #',
                    titlefont: { size: 18 }  // Adjust this size as needed
                 },
                yaxis: { 
                    title: 'Total Deaths',
                    titlefont: { size: 18 }  // Adjust this size as needed
                 }
            };
            Plotly.newPlot('chart-deaths', [traceDeaths], layoutDeaths);
        }).catch(function(error) {
            console.error("Error loading monthly data:", error);
        });
    }
}).catch(function(error) {
    console.error("Error loading yearly data:", error);  // Error handling
});