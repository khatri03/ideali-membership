export type PollAudienceType = "Public" | "MembersOnly";

export type PollStatus = "Draft" | "Published" | "Closed" | "Archived";

export type PollQuestionType =
  | "SingleChoice"
  | "MultipleChoice"
  | "YesNo"
  | "OpenText"
  | "StarRating"
  | "Nps"
  | "RankedChoice"
  | "Matrix"
  | "DateTimeAvailability";

export type PollVoteIdentityType = "Authenticated" | "Anonymous";

export interface OrganizerPollSummary {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueId: string | null;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questionCount: number;
  voteCount: number;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface OrganizerPollOption {
  uniqueId: string;
  label: string;
  value: string | null;
  displayOrder: number;
}

export interface OrganizerPollQuestion {
  uniqueId: string;
  questionType: PollQuestionType;
  text: string;
  displayOrder: number;
  isRequired: boolean;
  options: OrganizerPollOption[];
}

export interface OrganizerPollDetail {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueId: string | null;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questions: OrganizerPollQuestion[];
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface OrganizerPollQuestionDraft {
  uniqueId: string;
  questionType: PollQuestionType;
  text: string;
  displayOrder: number;
  isRequired: boolean;
  options: OrganizerPollOption[];
}

export interface OrganizerPollDraft {
  uniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueId: string | null;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  questions: OrganizerPollQuestionDraft[];
}

export interface OrganizerPollVoteAnswer {
  questionUniqueId: string;
  optionUniqueIds: string[];
  textValue: string | null;
  numericValue: number | null;
  rankValue: number | null;
}

export interface OrganizerPollVoteIdentity {
  voteIdentityType: PollVoteIdentityType;
  userUniqueId: string | null;
  anonymousVoteKeyHash: string | null;
}

export interface OrganizerPollVote {
  uniqueId: string;
  pollUniqueId: string;
  votedAtUtc: string;
  voteIdentity: OrganizerPollVoteIdentity;
  answers: OrganizerPollVoteAnswer[];
}
