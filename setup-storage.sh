#!/bin/bash

# Create uploads directory
mkdir -p /thunderstore/uploads/products

# Set proper permissions
chmod 755 /thunderstore/uploads
chmod 755 /thunderstore/uploads/products

# Create static directory if it doesn't exist
mkdir -p /thunderstore/client/src/assets/static
