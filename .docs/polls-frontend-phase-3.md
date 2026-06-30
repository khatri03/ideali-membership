# Polls Frontend - Phase 3

Current phase: 3/5

## What changed

- Added an organizer-facing Polls page
- Added a route at `/organizer/polls`
- Added a poll draft create screen at `/organizer/polls/create`
- Added a navigation entry under Membership
- Wired the page to the live poll contract and organizer list endpoint
- Added a visible frontend representation of the supported poll types and access rules

## Why this shape

- Keeps the UI aligned with the schema and API contract
- Gives us a real place in the app to grow the poll feature
- Avoids special-casing the early MVP screens

## Notes

- The page is API-aware and ready for live backend data.
- The backend migration label remains `AddOrganizerPolls`.
- The unsupported question types were trimmed from the contract and UI.
