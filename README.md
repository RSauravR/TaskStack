# TaskStack

A backend REST API for managing organizations, boards, and issues — inspired by tools like Trello and Jira. Built with Node.js and Express, it handles authentication, role-based access control, and structured project management at the organization level.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens)

---

## Project Structure

```
TaskStack/
├── middleware/
│   ├── authMiddleware.js
│   ├── organizationAdminMiddleware.js
│   ├── organizationMemberOrAdminMiddleware.js
│   └── boardOrganizationMemberOrAdminMiddleware.js
├── models.js
├── index.js
├── package.json
└── .gitignore
```

---

## Models

| Model        | Description                                      |
|--------------|--------------------------------------------------|
| User         | Stores user credentials and profile data         |
| Organization | Groups users under a shared workspace            |
| Board        | Belongs to an organization, contains issues      |
| Issue        | Task/ticket under a board with status tracking   |

---

## Middleware

| Middleware                                  | Purpose                                                          |
|---------------------------------------------|------------------------------------------------------------------|
| `authMiddleware`                            | Verifies JWT token and attaches user to request                  |
| `organizationAdminMiddleware`               | Restricts access to organization admins only                     |
| `organizationMemberOrAdminMiddleware`       | Allows access to both members and admins of an organization      |
| `boardOrganizationMemberOrAdminMiddleware`  | Validates that the user belongs to the board's parent organization |

---

## Getting Started

### Prerequisites

- Node.js v16+
- MongoDB running locally or a MongoDB Atlas connection string

### Installation

```bash
git clone https://github.com/RSauravR/TaskStack.git
cd TaskStack
npm install
```

### Environment

The app runs on port `3000` by default. Update the JWT secret and MongoDB URI in your environment or directly in the config before running.

```bash
# Start the server
node index.js
```

---

## API Overview

All protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login and get token |

### Organizations

| Method | Endpoint                        | Access              | Description                      |
|--------|---------------------------------|---------------------|----------------------------------|
| POST   | `/api/organizations`            | Authenticated       | Create an organization           |
| GET    | `/api/organizations/:id`        | Member or Admin     | Get organization details         |
| PUT    | `/api/organizations/:id`        | Admin only          | Update organization              |
| DELETE | `/api/organizations/:id`        | Admin only          | Delete organization              |
| POST   | `/api/organizations/:id/members`| Admin only          | Add a member to organization     |

### Boards

| Method | Endpoint                              | Access              | Description             |
|--------|---------------------------------------|---------------------|-------------------------|
| POST   | `/api/boards`                         | Member or Admin     | Create a board          |
| GET    | `/api/boards/:id`                     | Member or Admin     | Get board details       |
| PUT    | `/api/boards/:id`                     | Admin only          | Update a board          |
| DELETE | `/api/boards/:id`                     | Admin only          | Delete a board          |

### Issues

| Method | Endpoint                        | Access              | Description             |
|--------|---------------------------------|---------------------|-------------------------|
| POST   | `/api/issues`                   | Member or Admin     | Create an issue         |
| GET    | `/api/issues/:id`               | Member or Admin     | Get issue details       |
| PUT    | `/api/issues/:id`               | Member or Admin     | Update an issue         |
| DELETE | `/api/issues/:id`               | Admin only          | Delete an issue         |

---

## Role-Based Access Control

TaskStack enforces access at two levels:

- **Organization Admin** — full control over the organization, its boards, and members
- **Organization Member** — can view and interact with boards and issues within their organization

Access is enforced via middleware on every protected route.

---

## License

This project is open source and available under the [MIT License](LICENSE).