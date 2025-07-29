# Flash Groups Chat Application - System Design

This document outlines the architecture and design principles for the **Flash Groups** chat application. The system is designed as a set of decoupled services to ensure scalability, maintainability, and clear separation of concerns.

---

## 1. High-Level Architecture

The application follows a **microservices-oriented architecture** composed of two primary services: a **client (React SPA)** and a **server (NestJS API)**, supported by dedicated databases and deployed within a containerized environment.

### Components:

- **Client**: A React Single-Page Application (SPA) that serves as the user interface.
- **Load Balancer**: Distributes incoming traffic across multiple instances of the backend server.
- **Backend Server**: A stateless NestJS application handling business logic, API requests, and real-time communication.
- **PostgreSQL Database**: The primary relational database for storing persistent data like users, contacts, and standard chat history.
- **Redis Cache**: An in-memory data store used for ephemeral data, caching, and managing real-time state.

---

## 2. Data Flow for "Flash Groups"

The **"Flash Groups"** feature is designed to be efficient and self-cleaning by leveraging **Redis**.

### Workflow:

- **Initiation**:  
  A user sends a request to the backend to create a Flash Group, specifying the members and an expiration time (e.g., `3600` seconds).

- **Backend Logic**:
  - The NestJS service generates a **unique ID** for the Flash Group.
  - It stores the group's metadata (members, expiration timestamp) in a **Redis hash**.
  - Sets a **Time-To-Live (TTL)** on this Redis key corresponding to the desired duration.

- **Messaging**:  
  Messages sent to this group are appended to a **Redis List** associated with the group's ID.

- **Expiration**:  
  Once the TTL expires, Redis **automatically deletes** the group’s metadata and message list keys.  
  ✅ **No manual cleanup or cron job** is required, making the system highly efficient.

---

## 3. API Design

The backend will expose a **RESTful API** for standard operations and use **WebSockets** for real-time events.

### Authentication:

- Handled via `/api/auth/` endpoints.
- **JWTs** are issued upon successful login (local or OAuth).
- JWTs are required for all subsequent authenticated requests.

### REST API:

Standard CRUD operations for:

- Users
- Groups
- Fetching message history

These follow REST principles.

### WebSockets (`Socket.IO`):

Used for all real-time functionalities:

- `sendMessage`: Client emits to send a message.
- `receiveMessage`: Server broadcasts to relevant clients.
- `userTyping`: Client emits typing status.
- `userStatus`: Server broadcasts online/offline presence.

---
