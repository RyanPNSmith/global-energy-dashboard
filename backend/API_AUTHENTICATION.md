# API Authentication

This API is secured with API key authentication. All API endpoints require a valid API key to be included in the request headers.

## API Key

**API Key:** `4H2K8D7F5L9Q3X1A`

This is a 16-digit alphanumeric key that must be included in all API requests.

## How to Use

### Method 1: Using x-api-key header
```
GET /api/power-plants
x-api-key: 4H2K8D7F5L9Q3X1A
```

### Method 2: Using Authorization header
```
GET /api/power-plants
Authorization: 4H2K8D7F5L9Q3X1A
```

### Method 3: Using Bearer token format
```
GET /api/power-plants
Authorization: Bearer 4H2K8D7F5L9Q3X1A
```

## Example Requests

### Get all power plants
```bash
curl -H "x-api-key: 4H2K8D7F5L9Q3X1A" http://localhost:3000/api/power-plants
```

### Get power plants by country
```bash
curl -H "x-api-key: 4H2K8D7F5L9Q3X1A" "http://localhost:3000/api/power-plants?country=USA"
```

### Get all countries
```bash
curl -H "x-api-key: 4H2K8D7F5L9Q3X1A" http://localhost:3000/api/countries
```

## Error Responses

### Missing API Key (401 Unauthorized)
```json
{
  "success": false,
  "error": "API key is required",
  "message": "Please provide an API key in the x-api-key header or Authorization header"
}
```

### Invalid API Key Format (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid API key format",
  "message": "API key must be a 16-digit alphanumeric string"
}
```

### Invalid API Key (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

## Security Notes

- The API key is hardcoded in the middleware for demonstration purposes
- In a production environment, this should be stored in environment variables
- The API key should be kept secure and not shared publicly
- Consider implementing rate limiting for additional security 