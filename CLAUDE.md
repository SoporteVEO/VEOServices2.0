@AGENTS.md

# Development Guidelines

## General

- Follow the existing project architecture.
- Reuse existing UI components.
- Do not create new components if an equivalent exists.
- Do not introduce new dependencies without justification.
- Follow the naming conventions and patterns already established.

## Backend

- Follow existing controllers, services and repositories.
- Validate all incoming data.
- Use transactions for related database operations.
- Respect existing authentication and authorization patterns.

## Frontend

- Reuse components from the shared components directory.
- Follow existing form validation patterns.
- Follow existing data fetching and caching conventions.
- Handle loading, empty and error states.

## Workflow

1. Analyze the existing codebase.
2. Identify similar modules.
3. Produce an implementation plan.
4. Implement backend functionality.
5. Implement frontend functionality.
6. Run typechecks, linting and tests.
7. Review changes for regressions.

## Restrictions

- Do not modify unrelated modules.
- Do not change database schemas without documenting migrations.
- Do not expose secrets.
- Do not commit or deploy without explicit approval.
