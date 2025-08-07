# Database Configuration

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_new_password_here
DB_NAME=global_power_plants

# API Configuration
API_KEY=your_actual_api_key_here
```

## Database Connection

The application uses a centralized database connection in `src/db/index.js` that automatically loads environment variables.

## Steps to Update Database Password

1. **Create `.env` file** in the `backend` directory
2. **Add your new password** to the `DB_PASSWORD` variable
3. **Restart the server** to load the new configuration

## Example .env file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YourNewPassword123!
DB_NAME=global_power_plants
API_KEY=your_actual_api_key_here
```

## Security Notes

- Never commit the `.env` file to version control
- The `.env` file is already in `.gitignore`
- Use strong passwords for production environments
- Consider using different passwords for development and production 