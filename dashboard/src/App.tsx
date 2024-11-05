import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

const App: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend based on selected date range
    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) {
            setError("Please select both start and end dates");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`http://localhost:5000/api/bookings/daterange`, {
                params: {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to fetch booking data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate]);

    // Function to process visitor data by day
    const getVisitorsByDay = () => {
        const visitorMap = new Map();
        
        data.forEach(entry => {
            // Validate the date before processing
            const date = entry.arrival_date_day_of_month;
            if (!date || isNaN(date)) {
                return; // Skip invalid dates
            }

            if (!visitorMap.has(date)) {
                visitorMap.set(date, {
                    adults: 0,
                    children: 0,
                    total: 0
                });
            }
            
            const stats = visitorMap.get(date);
            // Use Number() to ensure we're adding numbers, not strings
            stats.adults += Number(entry.adults || 0);
            stats.children += Number(entry.children || 0);
            stats.total = stats.adults + stats.children;
        });

        // Convert the map to an array for the chart
        return Array.from(visitorMap, ([date, stats]) => ({
            date: date,
            adults: stats.adults,
            children: stats.children,
            total: stats.total
        }));
    };

    // Function to get total visitors statistics
    const getVisitorStats = () => {
        let totalAdults = 0;
        let totalChildren = 0;

        data.forEach(entry => {
            // Use Number() to ensure we're adding numbers
            totalAdults += Number(entry.adults || 0);
            totalChildren += Number(entry.children || 0);
        });

        return [
            { name: 'Adults', value: totalAdults },
            { name: 'Children', value: totalChildren }
        ];
    };

    // Function to get visitors by country
    const getVisitorsByCountry = () => {
        const countryMap = new Map<string, number>();
        
        data.forEach(entry => {
            const country = entry.country || 'Unknown';
            const visitors = Number(entry.adults || 0) + Number(entry.children || 0);
            countryMap.set(country, (countryMap.get(country) || 0) + visitors);
        });

        // Sort by visitor count and get top 10
        return Array.from(countryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    };

    // Function to get adult visitors data
    const getAdultVisitors = () => {
        return getVisitorsByDay().map(item => ({
            x: item.date,
            y: item.adults
        }));
    };

    // Function to get children visitors data
    const getChildrenVisitors = () => {
        return getVisitorsByDay().map(item => ({
            x: item.date,
            y: item.children
        }));
    };

    // Common chart theme
    const chartTheme = {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: '#ffffff',
        foreColor: '#333333'
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>
                Hotel Booking Dashboard
            </h1>
            
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px', 
                marginBottom: '30px',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                    <DatePicker 
                        selected={startDate} 
                        onChange={(date: Date | null) => setStartDate(date)}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select start date"
                        customInput={<input style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />}
                    />
                    <DatePicker 
                        selected={endDate} 
                        onChange={(date: Date | null) => setEndDate(date)}
                        dateFormat="yyyy-MM-dd"
                        minDate={startDate || undefined}
                        placeholderText="Select end date"
                        customInput={<input style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />}
                    />
                    <button 
                        onClick={fetchData}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
                    >
                        Generate Graphs
                    </button>
                </div>
                {error && <div style={{ color: '#e74c3c', padding: '10px', backgroundColor: '#fde8e8', borderRadius: '4px' }}>{error}</div>}
                {isLoading && <div style={{ color: '#3498db' }}>Loading data...</div>}
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '25px',
                padding: '10px'
            }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Chart 
                        options={{
                            theme: { mode: 'light', ...chartTheme },
                            chart: { 
                                type: 'bar',
                                toolbar: { show: true },
                                zoom: { enabled: true }
                            },
                            xaxis: { 
                                type: 'category',
                                title: { text: 'Date', style: { fontSize: '14px' } },
                                labels: {
                                    rotate: -45,
                                    style: {
                                        fontSize: '12px'
                                    }
                                }
                            },
                            yaxis: {
                                title: { text: 'Number of Visitors', style: { fontSize: '14px' } },
                                tickAmount: 5
                            },
                            title: { 
                                text: 'Total Visitors Per Day',
                                style: { fontSize: '16px', fontWeight: 600 }
                            },
                            tooltip: {
                                theme: 'light',
                                y: { formatter: (value) => Math.round(value).toString() }
                            },
                            plotOptions: {
                                bar: {
                                    columnWidth: '60%',
                                    borderRadius: 4,
                                    colors: {
                                        ranges: [{
                                            from: 0,
                                            to: 1000,
                                            color: '#3498db'
                                        }]
                                    }
                                }
                            }
                        }} 
                        series={[{
                            name: 'Total Visitors',
                            data: getVisitorsByDay().map(item => ({
                                x: item.date,
                                y: item.total
                            }))
                        }]}
                        type="bar"
                        height={350}
                    />
                </div>
                
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Chart 
                        options={{
                            theme: { mode: 'light', ...chartTheme },
                            chart: { 
                                type: 'bar',
                                toolbar: { show: true }
                            },
                            xaxis: { 
                                categories: getVisitorsByCountry().map((item: [string, number]) => item[0]),
                                title: { text: 'Country', style: { fontSize: '14px' } }
                            },
                            yaxis: {
                                title: { text: 'Number of Visitors', style: { fontSize: '14px' } }
                            },
                            title: { 
                                text: 'Top 10 Countries by Visitors',
                                style: { fontSize: '16px', fontWeight: 600 }
                            },
                            plotOptions: {
                                bar: {
                                    borderRadius: 6,
                                    horizontal: false,
                                    barHeight: '70%',
                                    distributed: true
                                }
                            },
                            colors: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c', '#1abc9c', '#34495e', '#16a085', '#27ae60', '#2980b9'],
                            dataLabels: {
                                enabled: true,
                                formatter: (val: number) => Math.round(val).toString(),
                                style: { fontSize: '12px' }
                            }
                        }} 
                        series={[{ 
                            name: 'Visitors', 
                            data: getVisitorsByCountry().map(([_, count]) => count)
                        }]} 
                        type="bar"
                        height={350}
                    />
                </div>
                
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Chart 
                        options={{
                            theme: { mode: 'light', ...chartTheme },
                            chart: { 
                                type: 'bar',
                                toolbar: { show: true },
                                zoom: { enabled: true }
                            },
                            xaxis: { 
                                type: 'category',
                                title: { text: 'Date', style: { fontSize: '14px' } },
                                labels: {
                                    rotate: -45,
                                    style: {
                                        fontSize: '12px'
                                    }
                                }
                            },
                            yaxis: {
                                title: { text: 'Number of Adults', style: { fontSize: '14px' } },
                                tickAmount: 5
                            },
                            title: { 
                                text: 'Adult Visitors Over Time',
                                style: { fontSize: '16px', fontWeight: 600 }
                            },
                            tooltip: {
                                theme: 'light',
                                y: { formatter: (value) => Math.round(value).toString() }
                            },
                            plotOptions: {
                                bar: {
                                    columnWidth: '60%',
                                    borderRadius: 4,
                                    colors: {
                                        ranges: [{
                                            from: 0,
                                            to: 1000,
                                            color: '#3498db'
                                        }]
                                    }
                                }
                            }
                        }} 
                        series={[{ 
                            name: 'Adults', 
                            data: getAdultVisitors(),
                            color: '#3498db'
                        }]} 
                        type="bar"
                        height={350}
                    />
                </div>
                
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Chart 
                        options={{
                            theme: { mode: 'light', ...chartTheme },
                            chart: { 
                                type: 'bar',
                                toolbar: { show: true },
                                zoom: { enabled: true }
                            },
                            xaxis: { 
                                type: 'category',
                                title: { text: 'Date', style: { fontSize: '14px' } },
                                labels: {
                                    rotate: -45,
                                    style: {
                                        fontSize: '12px'
                                    }
                                }
                            },
                            yaxis: {
                                title: { text: 'Number of Children', style: { fontSize: '14px' } },
                                tickAmount: 5
                            },
                            title: { 
                                text: 'Children Visitors Over Time',
                                style: { fontSize: '16px', fontWeight: 600 }
                            },
                            tooltip: {
                                theme: 'light',
                                y: { formatter: (value) => Math.round(value).toString() }
                            },
                            plotOptions: {
                                bar: {
                                    columnWidth: '60%',
                                    borderRadius: 4,
                                    colors: {
                                        ranges: [{
                                            from: 0,
                                            to: 1000,
                                            color: '#e74c3c'
                                        }]
                                    }
                                }
                            }
                        }} 
                        series={[{ 
                            name: 'Children', 
                            data: getChildrenVisitors(),
                            color: '#e74c3c'
                        }]} 
                        type="bar"
                        height={350}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
