export type PollAudienceType = "Public" | "MembersOnly";

export type PollStatus = "Draft" | "Published" | "Closed" | "Archived";

export type PollQuestionType =
  | "SingleChoice"
  | "MultipleChoice"
  | "StarRating"
  | "Nps"
  | "YesNo"
  | "RankedChoice"
  | "OpenText"
  | "Matrix";

export type PollListSortBy =
  | "title"
  | "audienceType"
  | "status"
  | "questionCount"
  | "voteCount";

export type PollVoteIdentityType = "Authenticated" | "Anonymous";

export interface OrganizerPollSummary {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueIds: string[];
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

export interface OrganizerPollMatrixRow {
  uniqueId: string;
  label: string;
  displayOrder: number;
}

export interface OrganizerPollMatrixColumn {
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
  matrixRows: OrganizerPollMatrixRow[];
  matrixColumns: OrganizerPollMatrixColumn[];
}

export interface OrganizerPollDetail {
  uniqueId: string;
  organizerUniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueIds: string[];
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
  matrixRows: OrganizerPollMatrixRow[];
  matrixColumns: OrganizerPollMatrixColumn[];
}

export interface OrganizerPollDraft {
  uniqueId: string;
  title: string;
  description: string | null;
  audienceType: PollAudienceType;
  status: PollStatus;
  requiredMembershipTypeUniqueIds: string[];
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
  matrixSelections: OrganizerPollVoteMatrixSelection[];
}

export interface OrganizerPollVoteMatrixSelection {
  rowUniqueId: string;
  columnUniqueId: string;
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
