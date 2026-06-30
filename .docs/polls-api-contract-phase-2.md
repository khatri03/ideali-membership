# Polls API Contract - Phase 2

Current phase: 2/6

## Route map

- `GET /api/organizer/polls`
- `POST /api/organizer/polls`
- `GET /api/organizer/polls/{pollUniqueId}`
- `PUT /api/organizer/polls/{pollUniqueId}`
- `POST /api/organizer/polls/{pollUniqueId}/publish`
- `POST /api/organizer/polls/{pollUniqueId}/close`
- `GET /api/organizer/polls/{pollUniqueId}/votes`
- `GET /api/public/polls`
- `GET /api/public/polls/{pollUniqueId}`
- `GET /api/public/polls/{pollUniqueId}/eligibility`
- `POST /api/public/polls/{pollUniqueId}/vote`

## Request / response contracts

### PollListRequest

- `pageNo`
- `pageSize`
- `searchText`
- `audienceType`
- `status`

### PollListResponse

- `items`
- `pageNo`
- `pageSize`
- `pageCount`
- `totalRecordsCount`

### PollDetailResponse

- poll detail fields
- `isEligibleToVote`
- `eligibilityMessage`
- `currentUserVoteCount`

### PollSaveRequest

- poll draft shape
- questions

### PollEligibilityResponse

- `pollUniqueId`
- `isEligible`
- `eligibilityMessage`
- `identityType`

### PollVoteRequest

- `voteIdentityType`
- `userUniqueId`
- `anonymousVoteKeyHash`
- `answers`

### PollVoteResponse

- `uniqueId`
- `pollUniqueId`
- `submittedAtUtc`
- `voteIdentityType`

## Notes

- Organizer routes manage lifecycle and moderation.
- Public routes handle rendering and voting.
- Eligibility must be checked on both read and submit.
- Anonymous public voting should still carry a stable anti-duplication identity.
- Keep API shapes small and typed so the frontend can consume them without ad hoc mapping.
- The organizer question-types endpoint is now locked to the supported enum set and covered by a controller contract test.
