# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy proxy.js file
COPY /app /app

# Run the proxy server
CMD [ "node", "index.js" ]