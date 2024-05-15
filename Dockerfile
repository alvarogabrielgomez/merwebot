# Use the official Node.js image as the base image
FROM node:19

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy the rest of the application code to the working directory
COPY . .
# Install dependencies
RUN npm ci


# Expose the port on which the server will listen
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
