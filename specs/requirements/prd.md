# Todo Webapp — PRD

## Problem Statement

People jot down tasks in scattered places — sticky notes, chat messages to
themselves, the back of an email — and lose track of what still needs doing.
They need one reliable, private place to keep a list of tasks that persists
between visits and devices, accessible only to them.

## Solution

A todo web application where each signed-in user keeps their own list of
tasks. Every user signs in through the organization's single sign-on, and
their todo entries are stored in a database so the list is always there the
next time they return, from any device.

## Actors

- **User** — a signed-in individual who creates, views, completes, and
deletes their own todo items. A User can only ever see and manage their own
list; there is no shared or cross-user visibility.

## User Stories

1. As a User, I want to sign in with my provisioned account, so that I can
 securely access my own todos.
2. As a User, I want to add a new todo item with a title, so that I can track
 a task I need to do.
3. As a User, I want to view all of my todo items, so that I can see what is
 outstanding and what is already done.
4. As a User, I want to mark a todo item as complete, so that I can see what
 I've finished.
5. As a User, I want to mark a completed todo item back as incomplete, so
 that I can correct a mistake.
6. As a User, I want to delete a todo item, so that I can remove tasks I no
 longer need.
7. As a User, I want to edit the title of an existing todo item, so that I
 can fix a typo or update its wording. *assumed*

## Product Decisions

- **Sign-in**: every user signs in via SSO through Thunder, the platform IDP
(organization default).
- **Account provisioning**: accounts are provisioned for users ahead of time
(invite-only); the product has no self-service sign-up flow.
- **Persistence**: each user's todo entries are persisted in a database so
they survive across sessions and devices.
- **Scope of visibility**: todos are private to the user who owns them; there
is no admin or shared oversight of another user's list.
- **Todo entry shape**: a todo item carries a title and a completion status
(done / not done) only — no due dates, priorities, tags, or categories.

## Out of Scope

- Self-service registration or sign-up.
- An admin or manager actor who can view or manage other users' todos.
- Due dates, reminders, priorities, tags, or categories on todo items.
- Sharing, collaborating on, or delegating todo items between users.

## Open Questions

1. What process or system provisions user accounts ahead of time (e.g. an
 admin console, a separate onboarding process)? — deferred: out of scope
 for this product; account provisioning happens outside this application.

## Further Notes

None.

