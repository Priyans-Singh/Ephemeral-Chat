# Flash Groups - Real-time Chat Application

Flash Groups is a modern, scalable, real-time chat application featuring one-on-one messaging, persistent group chats, and a unique "Flash Group" feature for temporary, expiring conversations.

This project is built as a portfolio piece to demonstrate a full-stack skill set, including modern frontend and backend development, DevOps practices with containerization and CI/CD, and deployment to a cloud-native architecture on AWS.

## Core Features

- **User Authentication:** Secure user registration and login with both email/password and OAuth 2.0 (Google Sign-In).
- **One-on-One & Group Chat:** Real-time, persistent messaging between users and in standard groups.
- **Flash Groups:** A unique feature allowing users to create temporary, auto-expiring chat groups for quick discussions.
- **Real-time Indicators:** Typing indicators and message read receipts.

## Tech Stack

| Category              | Technology                               |
| :-------------------- | :--------------------------------------- |
| **Frontend** | React with TypeScript, Shadcn/UI         |
| **Backend** | NestJS (on Node.js), Passport.js         |
| **Real-time** | Socket.IO                                |
| **Databases** | PostgreSQL (Persistent), Redis (Ephemeral) |
| **DevOps** | Docker, Kubernetes, Jenkins              |
| **Cloud** | AWS (EKS, RDS, ElastiCache, ECR)         |

## Getting Started

*(This section will be filled out later with instructions on how to run the project locally using Docker Compose.)*

## Project Structure

```
flash-groups-chat/
├── client/         # React Frontend
├── server/         # NestJS Backend
├── k8s/            # Kubernetes Manifests
├── Jenkinsfile     # CI/CD Pipeline Definition
└── docker-compose.yml # Local Development Environment
