# Use an LTS Node.js image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port your API runs on (e.g., 3000)
EXPOSE 3000

# Start the API
CMD ["npm", "start"]