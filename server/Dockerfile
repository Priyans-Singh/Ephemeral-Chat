# server/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies with clean install and verbose logging
RUN npm ci --verbose

# Copy the rest of the application's source code
COPY . .

# Expose the port the app runs on (adjust if your server uses a different port)
EXPOSE 3000

# Command to run the application in development mode with hot-reloading
CMD ["npm", "run", "start:dev"]
