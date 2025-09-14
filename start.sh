#!/bin/bash

# Start MySQL
docker-compose up -d mysql

# Wait a few seconds for MySQL to be ready
echo "Waiting for MySQL to start..."
sleep 10

# Run the Spring Boot app to load cards
./mvnw spring-boot:run