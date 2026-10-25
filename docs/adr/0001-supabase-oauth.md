# ADR-001: Integración de proyectos Supabase mediante OAuth

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Adopt Supabase OAuth Apps and the Supabase Management API to connect and manage user-owned Supabase projects.
- **Scope:** Application onboarding and Supabase project management

## Context

The application currently requires users who do not have Supabase configuration cached locally to manually provide:

- Supabase project URL
- Supabase anon/public key

These values are stored on the client.

This approach creates unnecessary friction because users are required to understand and manually retrieve technical configuration from their Supabase project.

The application also needs to support a model where:

1. A user can connect an existing Supabase project.
2. The application can create a new Supabase project for the user.
3. Multiple users can share the same Supabase project, for example a couple sharing an expense database.
4. The application runs its backend on Cloudflare Workers.

Supabase provides OAuth integrations and a Management API that allow third-party applications to obtain authorized access to a user's Supabase projects.

## Decision

The application will replace manual Supabase configuration with a **Supabase OAuth integration**.

The user will authenticate with the application normally and will have an additional action to connect their Supabase account.

The application will use the OAuth authorization flow to obtain permission to interact with the user's Supabase projects through the Supabase Management API.

The application will support two project connection flows:

### Existing project

```text
User
  │
  ▼
Application login
  │
  ▼
Connect Supabase
  │
  ▼
Supabase OAuth authorization
  │
  ▼
List accessible projects
  │
  ▼
User selects project
  │
  ▼
Project connected
```

### New project

```text
User
  │
  ▼
Application login
  │
  ▼
Connect Supabase
  │
  ▼
Supabase OAuth authorization
  │
  ▼
Create project
  │
  ▼
Configure project
  │
  ▼
Project connected
```

## User and project model

The application will **not assume a one-to-one relationship between application users and Supabase projects**.

Multiple application users may belong to the same project.

Conceptually:

```text
Application User A ──┐
                     ├── Supabase Project X
Application User B ──┘

Application User C ───── Supabase Project Y
```

This allows use cases such as:

- A couple sharing expenses
- Families sharing expenses
- Small teams
- Multiple devices/users operating on the same data

The application therefore needs a separate concept of a **project membership/connection** rather than storing a single `supabase_project_id` directly on the user.

## Proposed data model

A simplified model is:

```text
users
  │
  │
  ├──< project_memberships >── projects
  │
  │
  └──< shortcut_tokens
```

Where:

```text
projects
---------
id
supabase_project_ref
supabase_url
created_at
```

```text
project_memberships
-------------------
id
project_id
user_id
role
created_at
```

The exact schema may evolve during implementation.

## OAuth credentials

Supabase OAuth access and refresh tokens will be treated as application credentials.

They will not be embedded in:

- Frontend source code
- LocalStorage
- Cookies accessible to client-side JavaScript
- Shortcuts

The backend will be responsible for maintaining the OAuth authorization state.

The short-lived access token may be refreshed using the OAuth refresh token when required.

## Application architecture

The application will use Cloudflare Workers as the backend:

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    │                     │
                    │ SvelteKit / Web App │
                    └──────────┬──────────┘
                               │
                               │ OAuth initiation
                               ▼
                    ┌─────────────────────┐
                    │   Supabase OAuth    │
                    └──────────┬──────────┘
                               │
                               │ authorization
                               ▼
                    ┌─────────────────────┐
                    │   Cloudflare Worker │
                    │                     │
                    │ OAuth credentials   │
                    │ Project management  │
                    └──────────┬──────────┘
                               │
                               │ Management API
                               ▼
                    ┌─────────────────────┐
                    │ Supabase Management │
                    │        API          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ User's Supabase     │
                    │ Project             │
                    └─────────────────────┘
```

## Alternatives considered

### Alternative 1: Continue asking for URL and anon key

Rejected.

Problems:

- Poor user experience
- Requires technical knowledge
- Easy to misconfigure
- Makes onboarding unnecessarily complicated
- Does not provide a clean mechanism for managing multiple projects

### Alternative 2: Use only Supabase Auth

Rejected.

Supabase Auth identifies users inside a Supabase project. It does not automatically grant an application access to the user's Supabase account or to projects owned by that account.

Authentication of an application user and authorization to manage that user's Supabase projects are separate concerns.

### Alternative 3: Store a service role key

Rejected.

A service role key would provide excessive privileges and is not appropriate for client-side distribution or user-managed integrations.

### Alternative 4: Require users to create their project manually

Rejected as the primary onboarding flow.

Users should be able to connect an existing project, but the application should also have the ability to create a project automatically when the user chooses that option.

## Consequences

### Positive

- Removes manual Supabase configuration from onboarding.
- Users do not need to find or copy API keys.
- Existing Supabase projects can be connected.
- New Supabase projects can eventually be created automatically.
- Multiple application users can share one Supabase project.
- Project management is centralized in the backend.
- The application can evolve its infrastructure without exposing Supabase management credentials to clients.

### Negative

- Requires implementing OAuth authorization and token refresh.
- Requires persistent management of OAuth credentials.
- Introduces a dependency on the Supabase Management API.
- Project provisioning and configuration become additional backend responsibilities.

## Future extension: automatic project provisioning

The architecture intentionally supports automatic project creation.

A future onboarding flow may be:

```text
Create account
     │
     ▼
Connect Supabase
     │
     ▼
Create new project
     │
     ▼
Provision database/schema
     │
     ▼
Configure authentication
     │
     ▼
Create project membership
     │
     ▼
Application ready
```

This is not required for the initial implementation but is considered part of the intended platform direction.

## Initial implementation scope

The first implementation should prioritize:

1. Supabase OAuth application.
2. OAuth callback in Cloudflare Workers.
3. Secure persistence of OAuth authorization state.
4. Listing accessible Supabase projects.
5. Selecting an existing project.
6. Associating the project with the application's users.
7. Supporting multiple users per project.

Automatic project creation can be implemented after the connection flow is stable.