import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  Vote,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES, buildMembershipPollsPath } from "../../../app/router/routes";
import { fetchMembershipTypeOptions } from "../../../lib/membershipMembers";
import { MultiSelectInput } from "../../../shared/components/inputs/MultiSelectInput/MultiSelectInput";
import { showToast } from "../../../shared/components/toast/Toast";
import type { PollAudienceType, PollQuestionType } from "../../../types/polls";
import type { PollSaveRequest } from "../../../types/pollsApi";
import { createOrganizerPoll, fetchPollQuestionTypes } from "../lib";

type PollQuestionOptionDraft = {
  id: string;
  label: string;
  value: string;
};

type PollQuestionDraft = {
  id: string;
  questionType: PollQuestionType;
  text: string;
  isRequired: boolean;
  options: PollQuestionOptionDraft[];
};

type PollDraft = {
  title: string;
  description: string;
  audienceType: PollAudienceType;
  requiredMembershipTypeUniqueIds: string[];
  startsAtUtc: string;
  endsAtUtc: string;
  questions: PollQuestionDraft[];
};

type QuestionTypeChoice = {
  value: PollQuestionType;
  label: string;
  description: string;
  optionMode: "none" | "fixed" | "list";
};

const QUESTION_TYPE_METADATA: QuestionTypeChoice[] = [
  {
    value: "SingleChoice",
    label: "Single choice",
    description: "The default poll format when one answer is allowed.",
    optionMode: "list",
  },
  {
    value: "MultipleChoice",
    label: "Multiple choice",
    description: "Use when more than one answer can be selected.",
    optionMode: "list",
  },
  {
    value: "YesNo",
    label: "Yes / No",
    description: "Fast binary feedback with no extra setup.",
    optionMode: "fixed",
  },
  {
    value: "OpenText",
    label: "Open text",
    description: "Best for free-form feedback or comments.",
    optionMode: "none",
  },
  {
    value: "StarRating",
    label: "Star rating",
    description: "Good for quick sentiment scoring.",
    optionMode: "none",
  },
  {
    value: "Nps",
    label: "NPS",
    description: "Simple 0-10 loyalty scoring.",
    optionMode: "none",
  },
  {
    value: "RankedChoice",
    label: "Ranked choice",
    description: "Useful when respondents should rank options by preference.",
    optionMode: "list",
  },
];

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createOptionDraft(label: string, value: string): PollQuestionOptionDraft {
  return {
    id: createId(),
    label,
    value,
  };
}

function createDefaultOptions(questionType: PollQuestionType) {
  if (questionType === "YesNo") {
    return [
      createOptionDraft("Yes", "yes"),
      createOptionDraft("No", "no"),
    ];
  }

  if (questionType === "SingleChoice" || questionType === "MultipleChoice" || questionType === "RankedChoice") {
    return [
      createOptionDraft("Option 1", "option-1"),
      createOptionDraft("Option 2", "option-2"),
    ];
  }

  return [];
}

function createQuestionDraft(questionType: PollQuestionType = "SingleChoice"): PollQuestionDraft {
  return {
    id: createId(),
    questionType,
    text: "",
    isRequired: false,
    options: createDefaultOptions(questionType),
  };
}

function usesOptionList(questionType: PollQuestionType) {
  return questionType === "SingleChoice" || questionType === "MultipleChoice" || questionType === "RankedChoice";
}

function formatDateTimeLocal(value: string) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildPollRequest(draft: PollDraft): PollSaveRequest {
  return {
    uniqueId: createId(),
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    audienceType: draft.audienceType,
    status: "Draft",
    requiredMembershipTypeUniqueIds:
      draft.audienceType === "MembersOnly" ? draft.requiredMembershipTypeUniqueIds : [],
    startsAtUtc: formatDateTimeLocal(draft.startsAtUtc),
    endsAtUtc: formatDateTimeLocal(draft.endsAtUtc),
    questions: draft.questions.map((question, index) => ({
      uniqueId: question.id,
      questionType: question.questionType,
      text: question.text.trim(),
      displayOrder: index + 1,
      isRequired: question.isRequired,
      options: question.options.map((option, optionIndex) => ({
        uniqueId: option.id,
        label: option.label.trim(),
        value: option.value.trim() || null,
        displayOrder: optionIndex + 1,
      })),
    })),
  };
}

function validatePollDraft(draft: PollDraft) {
  if (!draft.title.trim()) {
    return "Poll title is required.";
  }

  if (draft.audienceType === "MembersOnly" && draft.requiredMembershipTypeUniqueIds.length === 0) {
    return "Choose at least one membership type for members-only polls.";
  }

  if (draft.questions.length === 0) {
    return "Add at least one question.";
  }

  for (const [questionIndex, question] of draft.questions.entries()) {
    if (!question.text.trim()) {
      return `Question ${questionIndex + 1} needs a label.`;
    }

    if (question.questionType === "YesNo") {
      continue;
    }

    if (usesOptionList(question.questionType)) {
      if (question.options.length < 2) {
        return `Question ${questionIndex + 1} needs at least two options.`;
      }

      for (const [optionIndex, option] of question.options.entries()) {
        if (!option.label.trim()) {
          return `Question ${questionIndex + 1}, option ${optionIndex + 1} needs text.`;
        }
      }
    }
  }

  return null;
}

function buildQuestionTypeTone(optionMode: QuestionTypeChoice["optionMode"]) {
  if (optionMode === "list") {
    return "bg-cyan-50 text-cyan-700";
  }

  if (optionMode === "fixed") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

export function PollCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PollDraft>({
    title: "",
    description: "",
    audienceType: "Public",
    requiredMembershipTypeUniqueIds: [],
    startsAtUtc: "",
    endsAtUtc: "",
    questions: [createQuestionDraft("SingleChoice")],
  });

  const membershipTypesQuery = useQuery({
    queryKey: ["membership-type-options"],
    queryFn: fetchMembershipTypeOptions,
    staleTime: 5 * 60 * 1000,
  });

  const questionTypesQuery = useQuery({
    queryKey: ["poll-question-types"],
    queryFn: fetchPollQuestionTypes,
    staleTime: 5 * 60 * 1000,
  });

  const createPollMutation = useMutation({
    mutationFn: createOrganizerPoll,
    onSuccess: async () => {
      showToast("Poll draft created.", "success");
      await queryClient.invalidateQueries({ queryKey: ["polls", "organizer"] });
      navigate(buildMembershipPollsPath());
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : "Unable to create the poll.", "error");
    },
  });

  const validationError = useMemo(() => validatePollDraft(draft), [draft]);
  const membershipTypeOptions = membershipTypesQuery.data ?? [];
  const liveQuestionTypeOptions = questionTypesQuery.data ?? [];
  const questionTypeChoices = QUESTION_TYPE_METADATA.map((choice) => ({
    ...choice,
    label: liveQuestionTypeOptions.find((item) => item.value === choice.value)?.text ?? choice.label,
  }));

  function updateQuestion(questionId: string, updater: (question: PollQuestionDraft) => PollQuestionDraft) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.id === questionId ? updater(question) : question)),
    }));
  }

  function addQuestion() {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, createQuestionDraft()],
    }));
  }

  function removeQuestion(questionId: string) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== questionId),
    }));
  }

  function addQuestionOption(questionId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: [
        ...question.options,
        createOptionDraft(`Option ${question.options.length + 1}`, `option-${question.options.length + 1}`),
      ],
    }));
  }

  function removeQuestionOption(questionId: string, optionId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.filter((option) => option.id !== optionId),
    }));
  }

  function setQuestionType(questionId: string, nextType: PollQuestionType) {
    updateQuestion(questionId, (question) => {
      if (question.questionType === nextType) {
        return question;
      }

      return {
        ...question,
        questionType: nextType,
        options: createDefaultOptions(nextType),
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValidationError = validatePollDraft(draft);
    if (nextValidationError) {
      showToast(nextValidationError, "error");
      return;
    }

    createPollMutation.mutate(buildPollRequest(draft));
  }

  const questionCount = draft.questions.length;
  const optionCount = draft.questions.reduce((total, question) => total + question.options.length, 0);
  const hasMembersAudience = draft.audienceType === "MembersOnly";

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Organizer polls
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create a poll draft
            </h1>
            <p className="max-w-2xl text-slate-600">
              This is the entry point for organizer-created polls. Keep it simple for now:
              title, audience, membership access, questions, then save as draft.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={APP_ROUTES.membershipPolls}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to polls
            </Link>
            <button
              type="submit"
              form="poll-create-form"
              disabled={createPollMutation.isPending}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
            >
              {createPollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create poll
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form id="poll-create-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  Poll title <span className="text-rose-600">*</span>
                </span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Community lunch choice"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional context for voters"
                  rows={4}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Audience</span>
                <select
                  value={draft.audienceType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      audienceType: event.target.value as PollAudienceType,
                      requiredMembershipTypeUniqueIds:
                        event.target.value === "Public" ? [] : current.requiredMembershipTypeUniqueIds,
                    }))
                  }
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="Public">Public</option>
                  <option value="MembersOnly">Members only</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Membership access</span>
                <MultiSelectInput
                  value={draft.requiredMembershipTypeUniqueIds}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, requiredMembershipTypeUniqueIds: value }))
                  }
                  options={membershipTypeOptions}
                  placeholder="Select one or more membership types"
                  isDisabled={!hasMembersAudience}
                  className="w-full"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Only active enrollments for the selected memberships can see members-only polls.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Starts at</span>
                <input
                  type="datetime-local"
                  value={draft.startsAtUtc}
                  onChange={(event) => setDraft((current) => ({ ...current, startsAtUtc: event.target.value }))}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Ends at</span>
                <input
                  type="datetime-local"
                  value={draft.endsAtUtc}
                  onChange={(event) => setDraft((current) => ({ ...current, endsAtUtc: event.target.value }))}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Questions</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  Build the poll structure
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Start with the common formats first. The model can expand later without changing this screen.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add question
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {draft.questions.map((question, questionIndex) => {
                const typeConfig = questionTypeChoices.find((item) => item.value === question.questionType);
                const questionTitle = `Question ${questionIndex + 1}`;

                return (
                  <article key={question.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                          {questionTitle}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {typeConfig?.description ?? "Choose a question type."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        disabled={draft.questions.length === 1}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="block lg:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">
                          Question text <span className="text-rose-600">*</span>
                        </span>
                        <input
                          value={question.text}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({ ...current, text: event.target.value }))
                          }
                          placeholder="What would you like to ask?"
                          className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">Question type</span>
                        <select
                          value={question.questionType}
                          onChange={(event) => setQuestionType(question.id, event.target.value as PollQuestionType)}
                          className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                          {questionTypeChoices.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                              {choice.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="flex items-end justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Required response</p>
                          <p className="text-xs text-slate-500">Treat this question as mandatory.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(question.id, (current) => ({ ...current, isRequired: !current.isRequired }))
                          }
                          className={[
                            "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                            question.isRequired
                              ? "border-cyan-500 bg-cyan-500"
                              : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-block h-6 w-6 rounded-full bg-white shadow-sm transition",
                              question.isRequired ? "translate-x-7" : "translate-x-1",
                            ].join(" ")}
                          />
                        </button>
                      </div>

                      {typeConfig?.optionMode === "list" ? (
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">Options</p>
                              <p className="text-xs text-slate-500">Use at least two options.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addQuestionOption(question.id)}
                              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add option
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={option.id}
                                className="grid gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                              >
                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Label
                                  </span>
                                  <input
                                    value={option.label}
                                    onChange={(event) =>
                                      updateQuestion(question.id, (current) => ({
                                        ...current,
                                        options: current.options.map((currentOption) =>
                                          currentOption.id === option.id
                                            ? { ...currentOption, label: event.target.value }
                                            : currentOption,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Value
                                  </span>
                                  <input
                                    value={option.value}
                                    onChange={(event) =>
                                      updateQuestion(question.id, (current) => ({
                                        ...current,
                                        options: current.options.map((currentOption) =>
                                          currentOption.id === option.id
                                            ? { ...currentOption, value: event.target.value }
                                            : currentOption,
                                        ),
                                      }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    placeholder="option-value"
                                  />
                                </label>

                                <div className="flex items-end justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeQuestionOption(question.id, option.id)}
                                    disabled={question.options.length === 1}
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {typeConfig?.optionMode === "fixed" ? (
                        <div className="lg:col-span-2 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                          This question uses the built-in Yes / No options. No extra setup is required.
                        </div>
                      ) : null}

                      {typeConfig?.optionMode === "none" ? (
                        <div className="lg:col-span-2 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          This question type does not need options.
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.membershipPolls)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPollMutation.isPending}
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
            >
              {createPollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create poll
            </button>
          </div>

          {validationError ? (
            <p className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {validationError}
            </p>
          ) : null}
        </form>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Live summary
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">What will be created</h2>

            <div className="mt-6 grid gap-3">
              <SummaryRow icon={Vote} label="Questions" value={String(questionCount)} />
              <SummaryRow icon={Users} label="Options" value={String(optionCount)} />
              <SummaryRow
                icon={ShieldCheck}
                label="Audience"
                value={draft.audienceType === "Public" ? "Public" : "Members only"}
              />
              <SummaryRow
                icon={CalendarClock}
                label="Schedule"
                value={draft.startsAtUtc || draft.endsAtUtc ? "Timed poll" : "No schedule yet"}
              />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Delivery rule</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organizer polls stay hidden if the current visitor is not eligible. That keeps the UI clean
                and avoids exposing locked content.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Common poll types
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              What we are supporting first
            </h2>

            <div className="mt-6 space-y-3">
              {questionTypeChoices.map((choice) => (
                <div key={choice.value} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{choice.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{choice.description}</p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        buildQuestionTypeTone(choice.optionMode),
                      ].join(" ")}
                    >
                      {choice.optionMode === "list"
                        ? "Core"
                        : choice.optionMode === "fixed"
                          ? "Built-in"
                          : "Simple"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-600">{value}</span>
    </div>
  );
}
