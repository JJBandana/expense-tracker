# ADR-002: Authentication of iPhone Shortcuts using revocable tokens

- **Status:** Accepted
- **Date:** 2026-08-31
- **Decision:** Authenticate iPhone Shortcuts through application-managed, revocable shortcut tokens rather than Supabase session tokens or direct Supabase credentials.
- **Scope:** iPhone Shortcuts integration

## Context

The application needs to allow users to create expenses from an iPhone Shortcut.

The Shortcut must be associated with the correct application user and, indirectly, with the Supabase project to which that user has access.

The Shortcut must not require the user to manually configure:

- Supabase URL
- Supabase anon key
- Supabase OAuth credentials
- Supabase access tokens
- Supabase service role keys

The application must also support multiple Shortcuts/devices per user and allow individual Shortcuts to be revoked.

## Decision

The application will use a dedicated **shortcut token** for each Shortcut installation.

The Shortcut will communicate exclusively with the application's Cloudflare Worker API.

The architecture will be:

```text
iPhone Shortcut
      │
      │ shortcut token
      ▼
Cloudflare Worker API
      │
      │ identify application user
      ▼
Project membership
      │
      ▼
User's Supabase project
```

The Shortcut will never communicate directly with the user's Supabase project.

## Token model

Each Shortcut installation receives its own token.

Example:

```text
User
├── iPhone → token A
├── iPad   → token B
└── iPhone backup → token C
```

The user will be able to:

- Create a Shortcut token
- Give it a name
- View existing Shortcut tokens
- Revoke an individual token
- Create additional tokens

## Proposed schema

```text
shortcut_tokens
----------------
id
user_id
token_hash
name
created_at
last_used_at
revoked_at
```

The raw token should only be available at creation time.

The database stores a hash of the token rather than the token itself.

Conceptually:

```text
Generated token
      │
      ▼
sk_abc123...
      │
      ▼
hash(token)
      │
      ▼
shortcut_tokens.token_hash
```

When the Shortcut makes a request:

```text
Authorization: Bearer sk_abc123...
```

the backend hashes the supplied token and looks up the corresponding record.

## User identification

The Shortcut will not send an arbitrary `user_id` as the authority for identifying the user.

Instead:

```text
shortcut token
      │
      ▼
shortcut_tokens
      │
      ▼
user_id
```

The server determines the authenticated application user from the token.

Therefore, a request cannot simply change:

```json
{
  "user_id": "another-user"
}
```

to impersonate another application user.

## Shared projects

Because multiple users may share a Supabase project, identifying the user and identifying the project are separate operations.

Example:

```text
User A
   │
   └── membership ──┐
                   │
                   ▼
              Project X
                   ▲
                   │
   ┌── membership ┘
   │
User B
```

A Shortcut belonging to User A authenticates as User A.

The application then determines which project(s) User A is authorized to use.

This allows two users to operate on the same underlying Supabase project without sharing Shortcut credentials.

## API flow

Creating an expense:

```text
Shortcut
   │
   │ POST /api/expenses
   │ Authorization: Bearer <shortcut-token>
   ▼
Cloudflare Worker
   │
   ├── validate token
   ├── identify user
   ├── resolve project membership
   └── create expense
           │
           ▼
      Supabase project
```

The Shortcut only needs to know the application's API endpoint and its own token.

## Shortcut creation flow

The application will provide a UI similar to:

```text
Settings
└── Shortcuts

    [+ Create Shortcut]

    iPhone
    Last used: Today
    [Revoke]

    iPad
    Last used: Aug 30
    [Revoke]
```

When creating a Shortcut:

```text
Create Shortcut
       │
       ▼
Generate cryptographically random token
       │
       ▼
Store token hash
       │
       ▼
Generate Shortcut configuration
       │
       ▼
User adds Shortcut to iPhone
```

## Separation of credentials

The system deliberately separates three types of credentials:

### Supabase OAuth credentials

Used by the backend to manage/connect the user's Supabase projects.

```text
Supabase account
       │
       ▼
OAuth credentials
       │
       ▼
Cloudflare Worker
```

### Supabase application credentials

Used by the application to communicate with the connected project.

These are managed by the application architecture and are not exposed as user configuration.

### Shortcut tokens

Used exclusively to authenticate Shortcut requests to the application's API.

```text
Shortcut
   │
   ▼
shortcut_token
   │
   ▼
Cloudflare Worker
```

The Shortcut never receives the Supabase OAuth credentials.

## Alternatives considered

### Alternative 1: Put Supabase access token inside the Shortcut

Rejected.

Supabase sessions are not appropriate as permanent Shortcut credentials because access tokens expire and exposing session credentials creates unnecessary coupling between the Shortcut and Supabase authentication.

### Alternative 2: Put Supabase anon key and URL inside the Shortcut

Rejected as the primary architecture.

Although an anon key is not itself a secret, this would:

- Couple the Shortcut directly to Supabase.
- Require exposing implementation details to users.
- Make backend changes harder.
- Make Shortcut authentication independent of the application's authorization model.

### Alternative 3: Ask users to enter credentials manually

Rejected.

This produces unnecessary technical complexity for users.

### Alternative 4: One token per user

Rejected.

Individual tokens provide better device management and revocation.

## Consequences

### Positive

- Shortcuts have independent credentials.
- Tokens can be revoked individually.
- Multiple devices are supported naturally.
- Supabase credentials remain outside the Shortcut.
- The API becomes an abstraction layer between Shortcuts and Supabase.
- The Supabase implementation can change without requiring every Shortcut to be regenerated.
- Shared Supabase projects are compatible with the architecture.

### Negative

- Requires token lifecycle management.
- Requires an API endpoint for Shortcut requests.
- Requires generating and distributing Shortcut configurations.
- Adds one network hop compared with direct Supabase access.

## Resulting architecture

The two ADRs together produce the following architecture:

```text
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                         Login / OAuth
                                  │
                                  ▼
                     ┌──────────────────────┐
                     │    Your Application  │
                     │                      │
                     │ Application Auth     │
                     │ Project Memberships  │
                     │ Shortcut Tokens      │
                     └───────┬───────┬──────┘
                             │       │
                 Supabase    │       │ Shortcut API
                 OAuth       │       │
                             ▼       ▼
                    ┌────────────┐  ┌──────────────┐
                    │ Supabase   │  │ iPhone       │
                    │ Management │  │ Shortcut     │
                    │ API        │  │              │
                    └─────┬──────┘  └──────┬───────┘
                          │                │
                          │                │ token
                          ▼                ▼
                    ┌────────────────────────────┐
                    │    Cloudflare Workers      │
                    └──────────────┬─────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │ User's Supabase  │
                         │ Project          │
                         └──────────────────┘
```

## Future considerations

Potential future improvements include:

- Automatic Supabase project creation.
- Automatic database/schema provisioning.
- Project-level roles.
- Invitation flow for shared projects.
- Multiple projects per application user.
- Shortcut token expiration.
- Token rotation.
- Audit logging.
- Per-token usage statistics.

These features are intentionally not required for the initial implementation.