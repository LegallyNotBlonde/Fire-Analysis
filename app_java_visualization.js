<script>
    // Load the yearly statistics CSV file with D3.js
    d3.csv('Outputs/yearly_stats.csv').then(function(data) {
        // Populate dropdown with unique years
        const yearSelect = d3.select("#year-select");
        const uniqueYears = [...new Set(data.map(d => d.Year))];
        uniqueYears.forEach(year => {
            yearSelect.append("option").text(year).attr("value", year);
        });

        // Initial display
        updateCharts(data, uniqueYears[0]);

        // Update charts when the year is selected
        yearSelect.on("change", function() {
            const selectedYear = this.value;
            updateCharts(data, selectedYear);
        });

        function updateCharts(data, selectedYear) {
            // Filter data by the selected year
            const filteredData = data.filter(d => d.Year == selectedYear)[0];

            // Console log the filtered data to verify
            console.log("Filtered Data:", filteredData);

            // Update total stats for the selected year
            const totalStatsDiv = d3.select("#total-stats");
            totalStatsDiv.html(`
                <p><strong>Total Fires:</strong> ${filteredData.total_fires}</p>
                <p><strong>Total Acres:</strong> ${filteredData.total_acres}</p>
                <p><strong>Average Duration:</strong> ${filteredData.avg_duration}</p>
                <p><strong>Total Deaths:</strong> ${filteredData.total_deaths}</p>
            `);

            // Load the monthly statistics CSV file with D3.js
            d3.csv('Outputs/monthly_stats.csv').then(function(monthlyData) {
                // Filter monthly data by the selected year
                const monthlyFilteredData = monthlyData.filter(d => d.Year == selectedYear);

                // Update Total Fires chart by Month
                const traceFires = {
                    x: monthlyFilteredData.map(d => d.Month),
                    y: monthlyFilteredData.map(d => d.total_fires),
                    type: 'bar',
                    name: 'Total Fires'
                };
                const layoutFires = {
                    title: `Total Fires by Month in ${selectedYear}`,
                    xaxis: { title: 'Month' },
                    yaxis: { title: 'Total Fires' }
                };
                Plotly.newPlot('chart-fires', [traceFires], layoutFires);

                // Update Total Acres chart by Month
                const traceAcres = {
                    x: monthlyFilteredData.map(d => d.Month),
                    y: monthlyFilteredData.map(d => d.total_acres),
                    type: 'bar',
                    name: 'Total Acres'
                };
                const layoutAcres = {
                    title: `Total Acres by Month in ${selectedYear}`,
                    xaxis: { title: 'Month' },
                    yaxis: { title: 'Total Acres' }
                };
                Plotly.newPlot('chart-acres', [traceAcres], layoutAcres);

                // Update Average Duration chart by Month
                const traceDuration = {
                    x: monthlyFilteredData.map(d => d.Month),
                    y: monthlyFilteredData.map(d => d.avg_duration),
                    type: 'bar',
                    name: 'Average Duration'
                };
                const layoutDuration = {
                    title: `Average Duration by Month in ${selectedYear}`,
                    xaxis: { title: 'Month' },
                    yaxis: { title: 'Average Duration' }
                };
                Plotly.newPlot('chart-duration', [traceDuration], layoutDuration);

                // Update Total Deaths chart by Month
                const traceDeaths = {
                    x: monthlyFilteredData.map(d => d.Month),
                    y: monthlyFilteredData.map(d => d.total_deaths),
                    type: 'bar',
                    name: 'Total Deaths'
                };
                const layoutDeaths = {
                    title: `Total Deaths by Month in ${selectedYear}`,
                    xaxis: { title: 'Month' },
                    yaxis: { title: 'Total Deaths' }
                };
                Plotly.newPlot('chart-deaths', [traceDeaths], layoutDeaths);
            }).catch(function(error) {
                console.error("Error loading monthly data:", error);
            });
        }
    }).catch(function(error) {
        console.error("Error loading yearly data:", error);  // Error handling
    });
</script>
