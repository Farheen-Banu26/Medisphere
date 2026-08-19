# Healthcare Management Platform For Clinical Operations— Local Development Guide

Welcome to the **MediSphere Healthcare Platform**. This guide explains how to run MediSphere locally using a lightweight hybrid architecture.

---

## Architecture Overview

MediSphere utilizes a **hybrid execution model**:
- **Docker**: Used only for core infrastructure (MongoDB, Kafka, Keycloak) to conserve RAM and disk space.
- **Local Host JVM / Python**: All Spring Boot microservices and the Flask AI service run directly on your host machine with tuned JVM memory constraints (`-Xmx256m` per service).
- **Frontend**: React/Vite application running via Node.js.

---

## Prerequisites

Before starting, ensure the following software is installed on your computer:

1. **Node.js** (v18 or higher) & **npm**
2. **Java Development Kit (JDK)** 17 or 21
3. **Python** 3.10+ (with dependencies in `flask-ai-service/requirements.txt` installed)
4. **Docker Desktop** (must be installed; the startup script will automatically check and start Docker if needed)

---

## Quick Start Commands

All commands are run from the root project directory (`d:\Medisphere`).

### 1. Start Infrastructure Only
Starts MongoDB (port 27017), Kafka (port 9092), and Keycloak (port 8081).
```bash
npm run infra
```

### 2. Start Complete Backend
Launches infrastructure, Eureka Server, Config Server, Flask AI Service, all 16 Spring Boot microservices, and API Gateway in the correct dependency order.
```bash
npm run backend
```
*(Or explicitly `npm run backend:full`)*

### 3. Start Core Backend Only (Lightweight Mode)
Starts infrastructure, Eureka, Config Server, API Gateway, and core services (`patient-service`, `vitals-service`, `health-twin-service`, `flask-ai-service`).
```bash
npm run backend:core
```

### 4. Start Frontend
Launches the React / Vite frontend UI on port 5173.
```bash
npm run frontend
```

### 5. Start Entire Environment (Backend + Frontend)
Starts full backend services followed by the frontend.
```bash
npm run dev
```

### 6. Check Service Status
Displays an interactive status table of all service ports and HTTP health endpoints.
```bash
npm run status
```

### 7. Stop Everything Cleanly
Gracefully terminates all backend and frontend microservices started by MediSphere without killing unrelated Java/Node processes.
```bash
npm run stop
```

To also stop Docker infrastructure containers:
```bash
npm run infra:stop
```

---

## Service Port Map

| Component / Service | Port | Endpoint / Console |
|---|---|---|
| **MongoDB** | `27017` | `mongodb://localhost:27017` |
| **Kafka** | `9092` | `localhost:9092` |
| **Keycloak** | `8081` | `http://localhost:8081` (Admin: `admin`/`admin`) |
| **Eureka Server** | `8761` | `http://localhost:8761` |
| **Config Server** | `8888` | `http://localhost:8888` |
| **API Gateway** | `8080` | `http://localhost:8080` |
| **Flask AI Service** | `5000` | `http://localhost:5000` |
| **AI Prediction Service** | `8985` | `http://localhost:8985` |
| **Prediction Service** | `8986` | `http://localhost:8986` |
| **Patient Service** | `8989` | `http://localhost:8989` |
| **Health Twin Service** | `8990` | `http://localhost:8990` |
| **Consent Service** | `8991` | `http://localhost:8991` |
| **Vitals Service** | `8992` | `http://localhost:8992` |
| **FHIR Service** | `8993` | `http://localhost:8993` |
| **Audit Service** | `8994` | `http://localhost:8994` |
| **Wearable Simulator** | `8995` | `http://localhost:8995` |
| **Dashboard Service** | `8997` | `http://localhost:8997` |
| **Explainability Service** | `8998` | `http://localhost:8998` |
| **Model Management Service** | `9001` | `http://localhost:9001` |
| **Alert Service** | `9002` | `http://localhost:9002` |
| **Notification Service** | `9003` | `http://localhost:9003` |
| **CarePlan Service** | `9004` | `http://localhost:9004` |
| **React Frontend** | `5173` | `http://localhost:5173` |

---

## Troubleshooting

### Port Already in Use
If a port is already taken by a stale process, run:
```bash
npm run stop
```
If the port remains occupied, check `npm run status` to see which port is affected.

### Docker Not Running
If Docker Desktop is closed, `npm run infra` or `npm run backend` will attempt to launch Docker Desktop and wait up to 45 seconds for the daemon to start. If it fails, start Docker Desktop manually and re-run the command.

### Eureka / Config Server Connection Failures
The orchestrator automatically waits for Eureka (`http://localhost:8761/eureka/apps`) and Config Server (`http://localhost:8888`) to be fully ready before launching dependent microservices. If Config Server fails, verify Java 17/21 installation.

### Resource Limits
Each Spring Boot service is configured with `-Xms64m -Xmx256m` memory bounds. If a service experiences an OutOfMemoryError during heavy testing, edit `getJVMArgs()` in `scripts/start-backend.js` to adjust memory bounds.
