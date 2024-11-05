const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Add middleware to parse JSON bodies

let hotelBookings = [];
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.get('/api/bookings', (req, res) => {
    res.json(hotelBookings);
});

// Move the API endpoints after file processing is complete
fs.createReadStream('./hotel_bookings_1000.csv')
  .pipe(csv())
  .on('data', (data) => hotelBookings.push(data))
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log(`Loaded ${hotelBookings.length} bookings`);
    
    // Define routes after data is loaded
    app.get('/api/bookings', (req, res) => {
        res.json(hotelBookings);
    });

    // Add endpoint for date range filtering
    app.get('/api/bookings/daterange', (req, res) => {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const filteredBookings = hotelBookings.filter(booking => {
                const arrivalDate = new Date(`${booking.arrival_date_year}-${booking.arrival_date_month}-${booking.arrival_date_day_of_month}`);
                return arrivalDate >= start && arrivalDate <= end;
            });

            res.json(filteredBookings);
            console.log(`Filtered ${filteredBookings.length} bookings`);
        } catch (error) {
            res.status(500).json({ error: 'Error processing date range' });
        }
    });

    // Start server after data is loaded
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
  });
