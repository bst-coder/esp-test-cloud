#!/bin/bash

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm run install-client

# Start both servers
echo "Starting servers..."
npm run dev:full
