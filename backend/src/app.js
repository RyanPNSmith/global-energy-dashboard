const express = require('express');
const powerPlantRoutes = require('./api/power_plants');
const countryRoutes = require('./api/countries');
const validateApiKey = require('./middleware/auth');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API running');
});

app.use('/api/power-plants', validateApiKey, powerPlantRoutes);
app.use('/api/countries', validateApiKey, countryRoutes);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;