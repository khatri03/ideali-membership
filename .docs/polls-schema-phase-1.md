# Polls Schema - Phase 1

Current phase: 1/6

## Scope

- Organizer-owned polls
- Public or MembersOnly audience
- Hide members-only polls from ineligible users
- Enforce eligibility again on submit
- One vote per person
- Leave room for later poll types without reworking the model

## Proposed C# entity shape

```csharp
public sealed class OrganizerPoll
{
    public Guid Id { get; set; }
    public Guid OrganizerId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public PollAudienceType AudienceType { get; set; }
    public PollStatus Status { get; set; }

    public DateTimeOffset? StartsAtUtc { get; set; }
    public DateTimeOffset? EndsAtUtc { get; set; }

    public Guid? RequiredMembershipTypeId { get; set; }

    public ICollection<OrganizerPollQuestion> Questions { get; set; } = new List<OrganizerPollQuestion>();
    public ICollection<OrganizerPollVote> Votes { get; set; } = new List<OrganizerPollVote>();
}

public sealed class OrganizerPollQuestion
{
    public Guid Id { get; set; }
    public Guid OrganizerPollId { get; set; }

    public string Text { get; set; } = string.Empty;
    public PollQuestionType QuestionType { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsRequired { get; set; }

    public ICollection<OrganizerPollOption> Options { get; set; } = new List<OrganizerPollOption>();
}

public sealed class OrganizerPollOption
{
    public Guid Id { get; set; }
    public Guid OrganizerPollQuestionId { get; set; }

    public string Label { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; }
}

public sealed class OrganizerPollVote
{
    public Guid Id { get; set; }
    public Guid OrganizerPollId { get; set; }

    public Guid? UserId { get; set; }
    public string? AnonymousVoteKeyHash { get; set; }
    public DateTimeOffset SubmittedAtUtc { get; set; }

    public ICollection<OrganizerPollVoteAnswer> Answers { get; set; } = new List<OrganizerPollVoteAnswer>();
}

public sealed class OrganizerPollVoteAnswer
{
    public Guid Id { get; set; }
    public Guid OrganizerPollVoteId { get; set; }
    public Guid OrganizerPollQuestionId { get; set; }

    public Guid? OrganizerPollOptionId { get; set; }
    public string? TextValue { get; set; }
    public decimal? NumericValue { get; set; }
    public int? RankValue { get; set; }
}
```

## Notes

- Keep `Public` and `MembersOnly` as the only audience modes for now.
- Do not add public membership exclusions in phase 1.
- Enforce one-vote-per-person with unique constraints in the database.
- Make votes append-only.
- Keep question payload flexible enough to support later poll types.
