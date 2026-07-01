import type { ComponentType } from "react";
import {
  BarChart3,
  CheckSquare2,
  CircleDot,
  ListOrdered,
  MessageSquareText,
  Star,
  Table2,
  ToggleLeft,
} from "lucide-react";
import type { PollQuestionType } from "../../../types/polls";
import type { PollQuestionTypeListItem } from "./pollsApi";

export type PollQuestionTypeOptionMode = "none" | "fixed" | "list" | "matrix";

export type PollQuestionTypeChoice = {
  value: PollQuestionType;
  label: string;
  description: string;
  optionMode: PollQuestionTypeOptionMode;
  icon: ComponentType<{ className?: string }>;
};

type PollQuestionTypeSource = PollQuestionType | PollQuestionTypeListItem;

export const POLL_QUESTION_TYPE_CATALOG: Record<PollQuestionType, PollQuestionTypeChoice> = {
  SingleChoice: {
    value: "SingleChoice",
    label: "Single choice",
    description: "Respondents pick exactly one option.",
    optionMode: "list",
    icon: CircleDot,
  },
  MultipleChoice: {
    value: "MultipleChoice",
    label: "Multiple choice",
    description: "Select all options that apply.",
    optionMode: "list",
    icon: CheckSquare2,
  },
  StarRating: {
    value: "StarRating",
    label: "Star rating",
    description: "Rate something on a 1 to 5 star scale.",
    optionMode: "none",
    icon: Star,
  },
  Nps: {
    value: "Nps",
    label: "NPS scale",
    description: "Capture promoter sentiment on a 0 to 10 scale.",
    optionMode: "none",
    icon: BarChart3,
  },
  YesNo: {
    value: "YesNo",
    label: "Yes / No",
    description: "Simple binary feedback with no extra setup.",
    optionMode: "fixed",
    icon: ToggleLeft,
  },
  RankedChoice: {
    value: "RankedChoice",
    label: "Ranked choice",
    description: "Drag to set preference order.",
    optionMode: "list",
    icon: ListOrdered,
  },
  OpenText: {
    value: "OpenText",
    label: "Open-ended",
    description: "Free-form text response.",
    optionMode: "none",
    icon: MessageSquareText,
  },
  Matrix: {
    value: "Matrix",
    label: "Matrix",
    description: "Capture structured responses across rows and columns.",
    optionMode: "matrix",
    icon: Table2,
  },
};

export const FALLBACK_POLL_QUESTION_TYPES = Object.keys(POLL_QUESTION_TYPE_CATALOG) as PollQuestionType[];

function normalizePollQuestionTypeSource(source: PollQuestionTypeSource) {
  if (typeof source === "string") {
    return {
      value: source,
      label: POLL_QUESTION_TYPE_CATALOG[source]?.label ?? source,
    };
  }

  return {
    value: source.value,
    label: (source.text.trim() || POLL_QUESTION_TYPE_CATALOG[source.value]?.label) ?? source.value,
  };
}

export function getPollQuestionTypeChoices(availableTypes: PollQuestionTypeSource[]) {
  const source = availableTypes.length > 0 ? availableTypes : FALLBACK_POLL_QUESTION_TYPES;
  const seen = new Set<PollQuestionType>();

  return source
    .filter((type) => {
      const value = typeof type === "string" ? type : type.value;

      if (seen.has(value)) {
        return false;
      }

      seen.add(value);
      return Boolean(POLL_QUESTION_TYPE_CATALOG[value]);
    })
    .map((type) => {
      const normalized = normalizePollQuestionTypeSource(type);
      const catalogItem = POLL_QUESTION_TYPE_CATALOG[normalized.value];

      return {
        ...catalogItem,
        label: normalized.label,
      };
    });
}

export function getPollQuestionTypeChoice(questionType: PollQuestionType) {
  return POLL_QUESTION_TYPE_CATALOG[questionType];
}

export function usesPollOptionList(questionType: PollQuestionType) {
  return questionType === "SingleChoice" || questionType === "MultipleChoice" || questionType === "RankedChoice";
}

export function usesPollMatrix(questionType: PollQuestionType) {
  return questionType === "Matrix";
}
