#!/bin/bash

# Export environment variables
export PORT=3000
export NODE_ENV=development
export MONGODB_URI=mongodb://localhost:27017/poap-attendance
export JWT_SECRET=dev-jwt-secret-key
export JWT_EXPIRES_IN=24h
export FRONTEND_URL=http://localhost:5173

# Contract configuration
export CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3  # Default Hardhat local network address
export RPC_URL=http://localhost:8545  # Default Hardhat local network

# Start the server
npm run dev 