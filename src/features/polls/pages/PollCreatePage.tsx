import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  type Modifier,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Monitor,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Star,
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
import { createOrganizerPoll, fetchOrganizerPollQuestionTypes } from "../lib";
import {
  FALLBACK_POLL_QUESTION_TYPES,
  getPollQuestionTypeChoice,
  getPollQuestionTypeChoices,
  type PollQuestionTypeChoice,
  usesPollMatrix,
  usesPollOptionList,
} from "../lib/pollQuestionTypes";

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
  matrixRows: PollQuestionOptionDraft[];
  matrixColumns: PollQuestionOptionDraft[];
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

function createMatrixRowDraft(label: string, value: string) {
  return createOptionDraft(label, value);
}

function createOptionValueFromLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function createDefaultMatrixRows() {
  return [
    createMatrixRowDraft("Row 1", "row-1"),
    createMatrixRowDraft("Row 2", "row-2"),
  ];
}

function createDefaultMatrixColumns() {
  return [
    createOptionDraft("Column 1", "column-1"),
    createOptionDraft("Column 2", "column-2"),
  ];
}

function createQuestionDraft(questionType: PollQuestionType = "SingleChoice"): PollQuestionDraft {
  return {
    id: createId(),
    questionType,
    text: "",
    isRequired: false,
    options: createDefaultOptions(questionType),
    matrixRows: questionType === "Matrix" ? createDefaultMatrixRows() : [],
    matrixColumns: questionType === "Matrix" ? createDefaultMatrixColumns() : [],
  };
}

function createMatrixQuestionContent() {
  return {
    matrixRows: createDefaultMatrixRows(),
    matrixColumns: createDefaultMatrixColumns(),
  };
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
      matrixRows: question.matrixRows.map((row, rowIndex) => ({
        uniqueId: row.id,
        label: row.label.trim(),
        displayOrder: rowIndex + 1,
      })),
      matrixColumns: question.matrixColumns.map((column, columnIndex) => ({
        uniqueId: column.id,
        label: column.label.trim(),
        value: column.value.trim() || null,
        displayOrder: columnIndex + 1,
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

    if (usesPollMatrix(question.questionType)) {
      if (question.matrixRows.length < 2 || question.matrixColumns.length < 2) {
        return `Question ${questionIndex + 1} needs at least two rows and two columns.`;
      }

      for (const [rowIndex, row] of question.matrixRows.entries()) {
        if (!row.label.trim()) {
          return `Question ${questionIndex + 1}, row ${rowIndex + 1} needs text.`;
        }
      }

      for (const [columnIndex, column] of question.matrixColumns.entries()) {
        if (!column.label.trim()) {
          return `Question ${questionIndex + 1}, column ${columnIndex + 1} needs text.`;
        }
      }

      continue;
    }

    if (usesPollOptionList(question.questionType)) {
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

export function PollCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialQuestion = useMemo(() => createQuestionDraft("SingleChoice"), []);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(initialQuestion.id);
  const [previewMode, setPreviewMode] = useState<"Desktop" | "Mobile">("Desktop");
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [draggedQuestionWidth, setDraggedQuestionWidth] = useState<number | null>(null);
  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
  const [draggedOptionWidth, setDraggedOptionWidth] = useState<number | null>(null);
  const [focusedOptionId, setFocusedOptionId] = useState<string | null>(null);
  const [focusedMatrixRowId, setFocusedMatrixRowId] = useState<string | null>(null);
  const [focusedMatrixColumnId, setFocusedMatrixColumnId] = useState<string | null>(null);
  const questionsListRef = useRef<HTMLDivElement | null>(null);
  const optionsListRef = useRef<HTMLDivElement | null>(null);
  const questionInputRefs = useRef(new Map<string, HTMLButtonElement>());
  const optionInputRefs = useRef(new Map<string, HTMLInputElement>());
  const matrixRowInputRefs = useRef(new Map<string, HTMLInputElement>());
  const matrixColumnInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [draft, setDraft] = useState<PollDraft>({
    title: "",
    description: "",
    audienceType: "Public",
    requiredMembershipTypeUniqueIds: [],
    startsAtUtc: "",
    endsAtUtc: "",
    questions: [initialQuestion],
  });

  const membershipTypesQuery = useQuery({
    queryKey: ["membership-type-options"],
    queryFn: fetchMembershipTypeOptions,
    staleTime: 5 * 60 * 1000,
  });
  const questionTypesQuery = useQuery({
    queryKey: ["polls", "organizer", "question-types"],
    queryFn: ({ signal }) => fetchOrganizerPollQuestionTypes(signal),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const restrictQuestionDragToParent = useMemo<Modifier>(
    () =>
      ({ draggingNodeRect, transform }) => {
        const questionList = questionsListRef.current;
        if (!questionList || !draggingNodeRect) {
          return transform;
        }

        const bounds = questionList.getBoundingClientRect();
        const minX = bounds.left - draggingNodeRect.left;
        const maxX = bounds.right - draggingNodeRect.right;
        const minY = bounds.top - draggingNodeRect.top;
        const maxY = bounds.bottom - draggingNodeRect.bottom;

        return {
          ...transform,
          x: Math.min(Math.max(transform.x, minX), maxX),
          y: Math.min(Math.max(transform.y, minY), maxY),
        };
      },
    [],
  );
  const restrictOptionDragToParent = useMemo<Modifier>(
    () =>
      ({ draggingNodeRect, transform }) => {
        const optionsList = optionsListRef.current;
        if (!optionsList || !draggingNodeRect) {
          return transform;
        }

        const bounds = optionsList.getBoundingClientRect();
        const minX = bounds.left - draggingNodeRect.left;
        const maxX = bounds.right - draggingNodeRect.right;
        const minY = bounds.top - draggingNodeRect.top;
        const maxY = bounds.bottom - draggingNodeRect.bottom;

        return {
          ...transform,
          x: Math.min(Math.max(transform.x, minX), maxX),
          y: Math.min(Math.max(transform.y, minY), maxY),
        };
      },
    [],
  );

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
  const questionTypeChoices = useMemo(
    () =>
      questionTypesQuery.data?.length
        ? getPollQuestionTypeChoices(questionTypesQuery.data)
        : questionTypesQuery.isError
          ? getPollQuestionTypeChoices(FALLBACK_POLL_QUESTION_TYPES)
          : [],
    [questionTypesQuery.data, questionTypesQuery.isError],
  );
  const activeQuestion = useMemo(
    () => draft.questions.find((question) => question.id === activeQuestionId) ?? draft.questions[0],
    [activeQuestionId, draft.questions],
  );
  const activeQuestionIndex = draft.questions.findIndex((question) => question.id === activeQuestion?.id);
  const activeQuestionChoice = activeQuestion
    ? questionTypeChoices.find((choice) => choice.value === activeQuestion.questionType) ??
      getPollQuestionTypeChoice(activeQuestion.questionType)
    : null;
  const defaultQuestionType = questionTypeChoices[0]?.value ?? "SingleChoice";
  const questionCount = draft.questions.length;
  const contentItemCount = draft.questions.reduce(
    (total, question) => total + question.options.length + question.matrixRows.length + question.matrixColumns.length,
    0,
  );
  const hasMembersAudience = draft.audienceType === "MembersOnly";
  const checklistItems = [
    { label: "Internal title set", done: Boolean(draft.title.trim()) },
    { label: "Audience selected", done: true },
    { label: "At least one question", done: draft.questions.length > 0 },
    { label: "Ready to publish", done: !validationError },
  ];

  useEffect(() => {
    if (!focusedOptionId) {
      return;
    }

    const input = optionInputRefs.current.get(focusedOptionId);
    if (input) {
      input.focus();
      input.select();
      setFocusedOptionId(null);
    }
  }, [focusedOptionId, draft.questions]);

  useEffect(() => {
    if (!focusedMatrixRowId) {
      return;
    }

    const input = matrixRowInputRefs.current.get(focusedMatrixRowId);
    if (input) {
      input.focus();
      input.select();
      setFocusedMatrixRowId(null);
    }
  }, [focusedMatrixRowId, draft.questions]);

  useEffect(() => {
    if (!focusedMatrixColumnId) {
      return;
    }

    const input = matrixColumnInputRefs.current.get(focusedMatrixColumnId);
    if (input) {
      input.focus();
      input.select();
      setFocusedMatrixColumnId(null);
    }
  }, [focusedMatrixColumnId, draft.questions]);

  function updateQuestion(questionId: string, updater: (question: PollQuestionDraft) => PollQuestionDraft) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.id === questionId ? updater(question) : question)),
    }));
  }

  function addQuestion() {
    const nextQuestion = createQuestionDraft(defaultQuestionType);
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, nextQuestion],
    }));
    setActiveQuestionId(nextQuestion.id);
  }

  function removeQuestion(questionId: string) {
    setDraft((current) => {
      const nextQuestions = current.questions.filter((question) => question.id !== questionId);
      const replacementQuestion = createQuestionDraft();
      if (questionId === activeQuestionId) {
        setActiveQuestionId(nextQuestions[0]?.id ?? replacementQuestion.id);
      }

      return {
        ...current,
        questions: nextQuestions.length > 0 ? nextQuestions : [replacementQuestion],
      };
    });
  }

  function handleQuestionDragStart(event: DragStartEvent) {
    setDraggedQuestionId(String(event.active.id));
    setDraggedQuestionWidth(event.active.rect.current.initial?.width ?? null);
  }

  function handleQuestionDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setDraggedQuestionId(null);
    setDraggedQuestionWidth(null);

    if (!over || active.id === over.id) {
      return;
    }

    setDraft((current) => {
      const fromIndex = current.questions.findIndex((question) => question.id === String(active.id));
      const toIndex = current.questions.findIndex((question) => question.id === String(over.id));

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      return {
        ...current,
        questions: arrayMove(current.questions, fromIndex, toIndex),
      };
    });
  }

  function handleQuestionDragCancel() {
    setDraggedQuestionId(null);
    setDraggedQuestionWidth(null);
  }

  function addQuestionOption(questionId: string) {
    const newOption = createOptionDraft("Option", "");
    updateQuestion(questionId, (question) => ({
      ...question,
      options: [...question.options, newOption],
    }));
    setFocusedOptionId(newOption.id);
  }

  function removeQuestionOption(questionId: string, optionId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.filter((option) => option.id !== optionId),
    }));
  }

  function addMatrixRow(questionId: string) {
    const newRow = createMatrixRowDraft("Row", "");
    updateQuestion(questionId, (question) => ({
      ...question,
      matrixRows: [...question.matrixRows, newRow],
    }));
    setFocusedMatrixRowId(newRow.id);
  }

  function removeMatrixRow(questionId: string, rowId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      matrixRows: question.matrixRows.filter((row) => row.id !== rowId),
    }));
  }

  function addMatrixColumn(questionId: string) {
    const newColumn = createOptionDraft("Column", "");
    updateQuestion(questionId, (question) => ({
      ...question,
      matrixColumns: [...question.matrixColumns, newColumn],
    }));
    setFocusedMatrixColumnId(newColumn.id);
  }

  function removeMatrixColumn(questionId: string, columnId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      matrixColumns: question.matrixColumns.filter((column) => column.id !== columnId),
    }));
  }

  function setQuestionType(questionId: string, nextType: PollQuestionType) {
    updateQuestion(questionId, (question) => {
      if (question.questionType === nextType) {
        return question;
      }

      const matrixDefaults = nextType === "Matrix" ? createMatrixQuestionContent() : { matrixRows: [], matrixColumns: [] };

      return {
        ...question,
        questionType: nextType,
        options: createDefaultOptions(nextType),
        matrixRows: matrixDefaults.matrixRows,
        matrixColumns: matrixDefaults.matrixColumns,
      };
    });
  }

  function handleOptionDragStart(event: DragStartEvent) {
    setDraggedOptionId(String(event.active.id));
    setDraggedOptionWidth(event.active.rect.current.initial?.width ?? null);
  }

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setDraggedOptionId(null);
    setDraggedOptionWidth(null);

    if (!over || active.id === over.id) {
      return;
    }

    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.id !== activeQuestionId) {
          return question;
        }

        const fromIndex = question.options.findIndex((option) => option.id === String(active.id));
        const toIndex = question.options.findIndex((option) => option.id === String(over.id));

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return question;
        }

        return {
          ...question,
          options: arrayMove(question.options, fromIndex, toIndex),
        };
      }),
    }));
  }

  function handleOptionDragCancel() {
    setDraggedOptionId(null);
    setDraggedOptionWidth(null);
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

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Poll builder
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
                Phase 3/5
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                Core types only
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Design the poll before it goes live
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              This builder keeps the mockup feel, but only exposes the approved MVP poll types for now.
              Everything else stays out of the UI until we genuinely need it.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">One vote per user</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Public or members only</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Hidden if ineligible</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[21rem] lg:flex-none">
            <Link
              to={APP_ROUTES.membershipPolls}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to polls
            </Link>
            <button
              type="submit"
              form="poll-create-form"
              disabled={createPollMutation.isPending}
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-300"
            >
              {createPollMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create poll
            </button>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300 sm:col-span-2">
              The layout is flexible enough to grow later, but the release surface stays intentionally small.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_392px]">
        <form id="poll-create-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Basics</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Set the poll identity</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep the metadata tight. The rest of the screen focuses on the question builder.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                MVP form
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
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

              <label className="block md:col-span-2">
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
                  onChange={(value) => setDraft((current) => ({ ...current, requiredMembershipTypeUniqueIds: value }))}
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
                <span className="mb-2 block text-sm font-semibold text-slate-800">Opens On</span>
                <input
                  type="datetime-local"
                  value={draft.startsAtUtc}
                  onChange={(event) => setDraft((current) => ({ ...current, startsAtUtc: event.target.value }))}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">Closes On</span>
                <input
                  type="datetime-local"
                  value={draft.endsAtUtc}
                  onChange={(event) => setDraft((current) => ({ ...current, endsAtUtc: event.target.value }))}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Questions</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Build the poll structure</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Drag questions to reorder them. The active question stays editable on the right.
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

            <div className="mt-6 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Questions in this poll</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {questionCount}
                  </span>
                </div>
                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictQuestionDragToParent]}
                  onDragStart={handleQuestionDragStart}
                  onDragEnd={handleQuestionDragEnd}
                  onDragCancel={handleQuestionDragCancel}
                >
                  <SortableContext items={draft.questions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
                    <div ref={questionsListRef} className="mt-4 flex flex-col gap-2">
                      {draft.questions.map((question, index) => (
                        <SortableQuestionListItem
                          key={question.id}
                          question={question}
                          index={index}
                          selected={question.id === activeQuestionId}
                          handleRef={(button) => {
                            if (button) {
                              questionInputRefs.current.set(question.id, button);
                            } else {
                              questionInputRefs.current.delete(question.id);
                            }
                          }}
                          onSelect={() => setActiveQuestionId(question.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  {typeof document !== "undefined"
                    ? createPortal(
                        <DragOverlay adjustScale={false} dropAnimation={null} modifiers={[restrictQuestionDragToParent]}>
                          {draggedQuestionId ? (
                            <QuestionDragPreview
                              question={draft.questions.find((item) => item.id === draggedQuestionId) ?? null}
                              width={draggedQuestionWidth}
                            />
                          ) : null}
                        </DragOverlay>,
                        document.body,
                      )
                    : null}
                </DndContext>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                {activeQuestion ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                          Active question
                        </p>
                        <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                          Question {activeQuestionIndex + 1}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {activeQuestionChoice?.description ?? "Choose a core format and keep the question focused."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(activeQuestion.id)}
                        disabled={draft.questions.length === 1}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Question type</p>
                            <p className="text-xs text-slate-500">
                              {questionTypesQuery.isLoading
                                ? "Loading available types from the backend..."
                                : "Pick a format from the cards below."}
                            </p>
                          </div>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                            Select visually
                          </span>
                        </div>

                        {questionTypesQuery.isLoading && questionTypeChoices.length === 0 ? (
                          <div className="mt-3 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Loading poll types...
                          </div>
                        ) : (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {questionTypeChoices.map((choice) => (
                              <QuestionTypeCard
                                key={choice.value}
                                choice={choice}
                                selected={activeQuestion.questionType === choice.value}
                                onSelect={() => setQuestionType(activeQuestion.id, choice.value)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-slate-800">
                          Question text <span className="text-rose-600">*</span>
                        </span>
                        <input
                          value={activeQuestion.text}
                          onChange={(event) =>
                            updateQuestion(activeQuestion.id, (current) => ({ ...current, text: event.target.value }))
                          }
                          placeholder="What would you like to ask?"
                          className="w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        />
                      </label>

                      <div className="flex items-end justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Required response</p>
                          <p className="text-xs text-slate-500">Treat this question as mandatory.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(activeQuestion.id, (current) => ({
                              ...current,
                              isRequired: !current.isRequired,
                            }))
                          }
                          className={[
                            "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                            activeQuestion.isRequired
                              ? "border-cyan-500 bg-cyan-500"
                              : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "inline-block h-6 w-6 rounded-full bg-white shadow-sm transition",
                              activeQuestion.isRequired ? "translate-x-7" : "translate-x-1",
                            ].join(" ")}
                          />
                        </button>
                      </div>

                      {activeQuestionChoice?.optionMode === "list" ? (
                        <div className="md:col-span-2">
                          <DndContext
                            sensors={dragSensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictOptionDragToParent]}
                            onDragStart={handleOptionDragStart}
                            onDragEnd={handleOptionDragEnd}
                            onDragCancel={handleOptionDragCancel}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Options</p>
                                <p className="text-xs text-slate-500">Use at least two options.</p>
                              </div>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                              Drag the handle to reorder options. Keep the row itself for editing only.
                            </p>

                            <SortableContext
                              items={activeQuestion.options.map((option) => option.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div ref={optionsListRef} className="mt-4 flex flex-col gap-3">
                                {activeQuestion.options.map((option, optionIndex) => (
                                  <SortableQuestionOptionRow
                                    key={option.id}
                                    option={option}
                                    optionIndex={optionIndex}
                                    optionCount={activeQuestion.options.length}
                                    onChange={(nextLabel) =>
                                      updateQuestion(activeQuestion.id, (current) => ({
                                        ...current,
                                        options: current.options.map((currentOption) =>
                                          currentOption.id === option.id
                                            ? {
                                                ...currentOption,
                                                label: nextLabel,
                                                value: createOptionValueFromLabel(nextLabel) || currentOption.value,
                                              }
                                            : currentOption,
                                        ),
                                      }))
                                    }
                                    onRemove={() => removeQuestionOption(activeQuestion.id, option.id)}
                                    inputRef={(input) => {
                                      if (input) {
                                        optionInputRefs.current.set(option.id, input);
                                      } else {
                                        optionInputRefs.current.delete(option.id);
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            </SortableContext>

                            {typeof document !== "undefined"
                              ? createPortal(
                                  <DragOverlay
                                    adjustScale={false}
                                    dropAnimation={null}
                                    modifiers={[restrictOptionDragToParent]}
                                  >
                                    {draggedOptionId ? (
                                      <OptionDragPreview
                                        option={
                                          activeQuestion.options.find((option) => option.id === draggedOptionId) ??
                                          null
                                        }
                                        width={draggedOptionWidth}
                                      />
                                    ) : null}
                                  </DragOverlay>,
                                  document.body,
                                )
                              : null}
                          </DndContext>

                          <button
                            type="button"
                            onClick={() => addQuestionOption(activeQuestion.id)}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-[1rem] border border-dashed border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add option
                          </button>
                        </div>
                      ) : null}

                      {activeQuestionChoice?.optionMode === "matrix" ? (
                        <div className="md:col-span-2 space-y-4">
                          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Matrix questions use rows and columns. Keep both lists simple and focused.
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">Rows</p>
                                  <p className="text-xs text-slate-500">Add the statements voters will evaluate.</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {activeQuestion.matrixRows.length}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {activeQuestion.matrixRows.map((row, rowIndex) => (
                                  <div
                                    key={row.id}
                                    className="grid gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5 md:grid-cols-[minmax(0,1fr)_auto]"
                                  >
                                    <input
                                      value={row.label}
                                      onChange={(event) =>
                                        updateQuestion(activeQuestion.id, (current) => ({
                                          ...current,
                                          matrixRows: current.matrixRows.map((currentRow) =>
                                            currentRow.id === row.id
                                              ? {
                                                  ...currentRow,
                                                  label: event.target.value,
                                                  value: createOptionValueFromLabel(event.target.value) || currentRow.value,
                                                }
                                              : currentRow,
                                          ),
                                        }))
                                      }
                                      ref={(input) => {
                                        if (input) {
                                          matrixRowInputRefs.current.set(row.id, input);
                                        } else {
                                          matrixRowInputRefs.current.delete(row.id);
                                        }
                                      }}
                                      className="w-full rounded-[0.85rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                      placeholder={`Row ${rowIndex + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeMatrixRow(activeQuestion.id, row.id)}
                                      disabled={activeQuestion.matrixRows.length === 1}
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label="Remove row"
                                    >
                                      <span className="text-lg leading-none">×</span>
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => addMatrixRow(activeQuestion.id)}
                                className="inline-flex w-full items-center justify-center rounded-[1rem] border border-dashed border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add row
                              </button>
                            </div>

                            <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">Columns</p>
                                  <p className="text-xs text-slate-500">Add the response options for each row.</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {activeQuestion.matrixColumns.length}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {activeQuestion.matrixColumns.map((column, columnIndex) => (
                                  <div
                                    key={column.id}
                                    className="grid gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5 md:grid-cols-[minmax(0,1fr)_auto]"
                                  >
                                    <input
                                      value={column.label}
                                      onChange={(event) =>
                                        updateQuestion(activeQuestion.id, (current) => ({
                                          ...current,
                                          matrixColumns: current.matrixColumns.map((currentColumn) =>
                                            currentColumn.id === column.id
                                              ? {
                                                  ...currentColumn,
                                                  label: event.target.value,
                                                  value: createOptionValueFromLabel(event.target.value) || currentColumn.value,
                                                }
                                              : currentColumn,
                                          ),
                                        }))
                                      }
                                      ref={(input) => {
                                        if (input) {
                                          matrixColumnInputRefs.current.set(column.id, input);
                                        } else {
                                          matrixColumnInputRefs.current.delete(column.id);
                                        }
                                      }}
                                      className="w-full rounded-[0.85rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                      placeholder={`Column ${columnIndex + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeMatrixColumn(activeQuestion.id, column.id)}
                                      disabled={activeQuestion.matrixColumns.length === 1}
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label="Remove column"
                                    >
                                      <span className="text-lg leading-none">×</span>
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => addMatrixColumn(activeQuestion.id)}
                                className="inline-flex w-full items-center justify-center rounded-[1rem] border border-dashed border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add column
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeQuestionChoice?.optionMode === "fixed" ? (
                        <div className="md:col-span-2 rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                          This question uses the built-in Yes / No options. No extra setup is required.
                        </div>
                      ) : null}

                      {activeQuestionChoice?.optionMode === "none" ? (
                        <div className="md:col-span-2 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          This question type does not need options.
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    No question selected.
                  </div>
                )}
              </div>
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
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Live preview</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">What the voter will see</h2>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("Desktop")}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    previewMode === "Desktop"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Monitor className="h-4 w-4" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("Mobile")}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    previewMode === "Mobile"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-900/10 bg-slate-950 p-3 shadow-xl">
              <div
                className={[
                  "mx-auto overflow-hidden rounded-[1.5rem] bg-white shadow-sm transition-all",
                  previewMode === "Mobile" ? "max-w-[360px]" : "w-full",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 bg-cyan-600 px-4 py-3 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4" />
                  PollDesk preview
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Live poll</p>
                    <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                      {draft.title || "Your poll title appears here"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {draft.description || "Add a short description if voters need context."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {draft.audienceType === "Public" ? "Public" : "Members only"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {hasMembersAudience
                        ? `${draft.requiredMembershipTypeUniqueIds.length} memberships`
                        : "No membership gate"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {draft.startsAtUtc || draft.endsAtUtc ? "Timed" : "No schedule"}
                    </span>
                  </div>

                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Question {activeQuestionIndex + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {activeQuestion?.text || "Write the question text here"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">{renderQuestionPreview(activeQuestion)}</div>

                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-[1rem] bg-cyan-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Submit vote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Publish checklist</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Ready to ship?</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {checklistItems.filter((item) => item.done).length} / {checklistItems.length}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {checklistItems.map((item) => (
                <ChecklistRow key={item.label} label={item.label} done={item.done} />
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                  <Vote className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Live summary</p>
                  <p className="text-sm text-slate-500">
                    {questionCount} questions and {contentItemCount} configurable items configured.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <SummaryRow
                  icon={ShieldCheck}
                  label="Audience"
                  value={draft.audienceType === "Public" ? "Public" : "Members only"}
                />
                <SummaryRow icon={Users} label="Memberships" value={hasMembersAudience ? String(draft.requiredMembershipTypeUniqueIds.length) : "0"} />
                <SummaryRow
                  icon={CalendarClock}
                  label="Schedule"
                  value={draft.startsAtUtc || draft.endsAtUtc ? "Timed poll" : "No schedule yet"}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SortableQuestionOptionRow({
  option,
  optionIndex,
  optionCount,
  onChange,
  onRemove,
  inputRef,
}: {
  option: PollQuestionOptionDraft;
  optionIndex: number;
  optionCount: number;
  onChange: (nextLabel: string) => void;
  onRemove: () => void;
  inputRef: (input: HTMLInputElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
  });

  return (
    <div
      ref={setNodeRef}
      data-dragging={isDragging ? "true" : "false"}
      className={[
        "grid gap-3 rounded-[1rem] border bg-slate-50 p-2.5 md:grid-cols-[auto_minmax(0,1fr)_auto] will-change-transform",
        isDragging ? "border-cyan-200 bg-cyan-50/50 opacity-35 ring-2 ring-cyan-100" : "border-slate-200",
      ].join(" ")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className="flex h-full cursor-grab items-center justify-center rounded-[0.85rem] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-400 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 active:cursor-grabbing"
        aria-label="Drag option to reorder"
        {...attributes}
        {...listeners}
      >
        <span className="select-none text-lg leading-none">⠿</span>
      </button>

      <label className="block">
        <input
          value={option.label}
          onChange={(event) => onChange(event.target.value)}
          ref={inputRef}
          className="w-full rounded-[0.85rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder={`Option ${optionIndex + 1}`}
        />
      </label>

      <div className="flex items-end justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={optionCount === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Remove option"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}

function SortableQuestionListItem({
  question,
  index,
  selected,
  onSelect,
  handleRef,
}: {
  question: PollQuestionDraft;
  index: number;
  selected: boolean;
  onSelect: () => void;
  handleRef: (button: HTMLButtonElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const choice = getPollQuestionTypeChoice(question.questionType);

  return (
    <div
      ref={setNodeRef}
      data-dragging={isDragging ? "true" : "false"}
      className={[
        "rounded-[1.35rem] border px-4 py-3 text-left transition",
        selected
          ? "border-cyan-200 bg-white shadow-sm"
          : "border-slate-200 bg-white/70 hover:border-cyan-200 hover:bg-white",
        isDragging ? "opacity-35 ring-2 ring-cyan-100" : "",
      ].join(" ")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Question {index + 1}</p>
          <button
            type="button"
            ref={handleRef}
            className="inline-flex h-7 w-7 items-center justify-center text-slate-400 transition hover:text-cyan-700 active:cursor-grabbing"
            aria-label={`Drag question ${index + 1} to reorder`}
            {...attributes}
            {...listeners}
          >
            <span className="select-none text-lg leading-none">⠿</span>
          </button>
        </div>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{question.text || "Untitled question"}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{choice?.label ?? "Question"}</p>
      </div>
    </div>
  );
}

function QuestionDragPreview({ question, width }: { question: PollQuestionDraft | null; width: number | null }) {
  if (!question) {
    return null;
  }

  const choice = getPollQuestionTypeChoice(question.questionType);

  return (
    <div
      className="max-w-[calc(100vw-2rem)] cursor-grabbing rounded-[1.35rem] border border-cyan-300 bg-white p-4 shadow-2xl shadow-slate-900/20 ring-4 ring-cyan-100"
      style={{ width: width ?? undefined }}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">Question</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{question.text || "Untitled question"}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{choice?.label ?? "Question"}</p>
      </div>
    </div>
  );
}

function OptionDragPreview({ option, width }: { option: PollQuestionOptionDraft | null; width: number | null }) {
  if (!option) {
    return null;
  }

  return (
    <div
      className="grid max-w-[calc(100vw-2rem)] cursor-grabbing gap-3 rounded-[1rem] border border-cyan-300 bg-white p-2.5 shadow-2xl shadow-slate-900/20 ring-4 ring-cyan-100 md:grid-cols-[auto_minmax(0,1fr)_auto]"
      style={{ width: width ?? undefined }}
    >
      <div className="flex h-full items-center justify-center rounded-[0.85rem] border border-cyan-200 bg-cyan-50 px-3 py-3 text-sm text-cyan-700">
        <span className="select-none text-lg leading-none">⠿</span>
      </div>
      <div className="rounded-[0.85rem] border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm font-medium text-slate-900">
        {option.label || "Option"}
      </div>
      <div className="flex items-end justify-end">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-cyan-100 bg-cyan-50 text-cyan-500">
          ×
        </div>
      </div>
    </div>
  );
}

function QuestionTypeCard({
  choice,
  selected,
  onSelect,
}: {
  choice: PollQuestionTypeChoice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "rounded-[1.35rem] border p-4 text-left transition",
        selected
          ? "border-cyan-300 bg-cyan-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/60",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className={selected ? "inline-flex text-cyan-700" : "inline-flex text-slate-500"}>
              <choice.icon className="h-5 w-5" />
            </span>
            <p className="min-w-0 text-sm font-semibold text-slate-900">{choice.label}</p>
          </div>
          <p className="text-sm leading-6 text-slate-500">{choice.description}</p>
        </div>
      </div>
    </button>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-[1.1rem] border px-4 py-3 text-sm",
        done ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
      ) : (
        <ChevronRight className="h-4 w-4 flex-none text-slate-400" />
      )}
      <span className="font-medium">{label}</span>
    </div>
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

function renderQuestionPreview(question?: PollQuestionDraft) {
  if (!question) {
    return null;
  }

  if (question.questionType === "OpenText") {
    return (
      <div className="rounded-[1.2rem] border border-slate-200 bg-white p-3 text-sm text-slate-400">
        Type your answer here...
      </div>
    );
  }

  if (question.questionType === "YesNo") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
          Yes
        </button>
        <button type="button" className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700">
          No
        </button>
      </div>
    );
  }

  if (question.questionType === "StarRating") {
    return (
      <div className="space-y-3 rounded-[1.2rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-5 w-5 fill-current" />
          ))}
        </div>
        <p className="text-sm text-slate-500">Tap a star to rate this question.</p>
      </div>
    );
  }

  if (question.questionType === "Nps") {
    return (
      <div className="space-y-3 rounded-[1.2rem] border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }).map((_, index) => (
            <div
              key={index}
              className={[
                "flex h-9 items-center justify-center rounded-lg border text-xs font-semibold",
                index <= 6
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : index <= 8
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              {index}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">Score from 0 to 10 to measure loyalty.</p>
      </div>
    );
  }

  const previewOptions =
    question.options.length > 0
      ? question.options
      : [createOptionDraft("Option 1", "option-1"), createOptionDraft("Option 2", "option-2")];

  if (question.questionType === "Matrix") {
    const previewRows =
      question.matrixRows.length > 0 ? question.matrixRows : [createMatrixRowDraft("Row 1", "row-1"), createMatrixRowDraft("Row 2", "row-2")];
    const previewColumns =
      question.matrixColumns.length > 0
        ? question.matrixColumns
        : [createOptionDraft("Column 1", "column-1"), createOptionDraft("Column 2", "column-2")];
    const matrixGridColumns = `minmax(0, 1.2fr) repeat(${previewColumns.length}, minmax(0, 1fr))`;

    return (
      <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white">
        <div
          className="grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
          style={{ gridTemplateColumns: matrixGridColumns }}
        >
          <div className="px-3 py-3">Row</div>
          {previewColumns.map((column) => (
            <div key={column.id} className="px-3 py-3 text-center">
              {column.label || "Column"}
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-200">
          {previewRows.map((row) => (
            <div key={row.id} className="grid" style={{ gridTemplateColumns: matrixGridColumns }}>
              <div className="px-3 py-3 text-sm font-medium text-slate-700">{row.label || "Row"}</div>
              {previewColumns.map((column) => (
                <div key={`${row.id}-${column.id}`} className="flex items-center justify-center px-3 py-3">
                  <span className="h-4 w-4 rounded-full border border-slate-300" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (question.questionType === "RankedChoice") {
    return (
      <div className="space-y-2">
        {previewOptions.map((option, index) => (
          <div
            key={option.id}
            className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
              {index + 1}
            </span>
            <span>{option.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {previewOptions.map((option) => (
        <div key={option.id} className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
          <span className="h-4 w-4 rounded-full border border-slate-300" />
          <span>{option.label}</span>
        </div>
      ))}
    </div>
  );
}
