# Global Energy Map Implementation

## Overview
This implementation adds an interactive map to the global energy dashboard that displays power plants worldwide, categorized by fuel type and capacity.

## Features

### Map Components
- **Interactive Map**: Built with React-Leaflet and OpenStreetMap tiles
- **Power Plant Markers**: Circle markers with size based on capacity (MW)
- **Color Coding**: Different colors for each fuel type (Coal, Gas, Nuclear, Hydro, Wind, Solar, etc.)
- **Interactive Popups**: Click on markers to see detailed plant information
- **Legend**: Bottom-right legend showing fuel type colors and marker size explanation
- **Country Selection**: Click "View Country Data" in popups to select countries for analysis

### Fuel Type Colors
- Coal: Black (#000000)
- Gas: Orange (#FFA500)
- Oil: Brown (#8B4513)
- Hydro: Blue (#1E90FF)
- Nuclear: Purple (#800080)
- Wind: Light Blue (#00BFFF)
- Solar: Gold (#FFD700)
- Biomass: Green (#228B22)
- Geothermal: Orange Red (#FF4500)
- Waste: Brown (#A52A2A)
- Other: Gray (#808080)

### Marker Sizing
- < 100 MW: 3px radius
- 100-500 MW: 5px radius
- 500-1000 MW: 7px radius
- 1000-2000 MW: 9px radius
- > 2000 MW: 12px radius

## Files Structure

```
frontend/
├── components/
│   ├── map/PowerPlantMap.jsx      # Main map component
│   └── ui/
│       ├── badge.jsx              # Badge component for popups
│       └── card.jsx               # Card component for legend
├── app/
│   ├── api/
│   │   └── power-plants/
│   │       └── route.js           # API endpoint for power plant data
│   ├── page.js                    # Main dashboard with map integration
│   └── globals.css                # CSS with Leaflet styles
└── lib/
    └── utils.js                   # Utility functions
```

## API Endpoint

### GET /api/power-plants
Returns an array of power plant objects with the following structure:

```javascript
{
  id: string,
  name: string,
  country: string,
  capacity_mw: number,
  latitude: number,
  longitude: number,
  primary_fuel: string,
  commissioning_year?: number
}
```

## Integration

The map is integrated into the main dashboard as a card component. It includes:

1. **State Management**: Tracks selected countries from map interactions
2. **Responsive Design**: Adapts to different screen sizes
3. **Error Handling**: Falls back to sample data if API fails
4. **Loading States**: Shows loading indicator while fetching data

## Future Enhancements

### Data Integration
- Connect to real power plant databases
- Add real-time data updates
- Implement data filtering by region, fuel type, or capacity

### Map Features
- Add clustering for dense areas
- Implement search functionality
- Add different map tile options
- Include time-based filtering

### Analytics
- Add charts showing fuel type distribution
- Include capacity statistics by region
- Add trend analysis over time

## Dependencies

- `react-leaflet`: React wrapper for Leaflet maps
- `leaflet`: Core mapping library
- `lucide-react`: Icons
- `class-variance-authority`: Component styling
- `clsx` & `tailwind-merge`: Utility functions

## Usage

The map component can be used independently or integrated into other parts of the application:

```javascript
import PowerPlantMap from '../components/map/PowerPlantMap'

function MyComponent() {
  const [selectedCountries, setSelectedCountries] = useState([])
  
  return (
    <PowerPlantMap onCountrySelect={setSelectedCountries} />
  )
}
```

## Styling

The map uses Tailwind CSS classes and custom CSS for:
- Map container styling
- Popup styling
- Legend positioning
- Responsive design

Custom CSS is included in `globals.css` for Leaflet-specific styling. 