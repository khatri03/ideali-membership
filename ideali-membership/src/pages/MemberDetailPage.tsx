import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Building2, Download, ExternalLink, FileText, Globe2, Hash, Home, Image, Landmark, Mail, MapPinned, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../routes";
import { downloadBinaryFile, openBinaryFile } from "../lib/api";
import { cn } from "../lib/utils";
import { fetchCountryOptions, fetchStateOptions } from "../lib/customForms";
import { EmptyStatePanel, DetailPanel, StatCard, StatusPill } from "./MemberDetailPage.parts";
import { useMemberDetailPage } from "./MemberDetailPage.hooks";
import { getCustomFormFieldSpanClass, getCustomFormGridClass, getCustomFormControlType, getCustomQuestionControlType } from "./MembershipRegisterPage/MembershipRegisterWizard.logic";
import type { MembershipMemberCustomFormAnswer, MembershipMemberCustomQuestionAnswer } from "../types/membership";
import type { MembershipRegistrationCustomQuestionOption } from "../types/membershipRegistration";

type MemberTone = "slate" | "cyan" | "emerald" | "amber" | "rose";
const MEMBER_DETAIL_TAB_ID = "member-detail";

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeStatusValue(value: string) {
  return value.replace(/[\s_-]+/g, "").toLowerCase();
}

function getStatusTone(status: string): MemberTone {
  switch (normalizeStatusValue(status)) {
    case "active":
      return "emerald";
    case "pendingapproval":
    case "pending":
      return "amber";
    case "expired":
      return "rose";
    case "inactive":
    case "nearexpiry":
      return "cyan";
    default:
      return "slate";
  }
}

function getAddressFieldIcon(fieldLabel: string) {
  switch (fieldLabel) {
    case "Type":
      return <Home size={16} />;
    case "Address Line 1":
      return <MapPinned size={16} />;
    case "Address Line 2":
      return <FileText size={16} />;
    case "City":
      return <Building2 size={16} />;
    case "State":
      return <Landmark size={16} />;
    case "Country":
      return <Globe2 size={16} />;
    case "Zip/Postal Code":
      return <Hash size={16} />;
    default:
      return <FileText size={16} />;
  }
}

function parseSelectedValues(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to the delimiter-based parser below.
    }
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MemberDetailPage() {
  const [activeDetailTabId, setActiveDetailTabId] = useState<string>(MEMBER_DETAIL_TAB_ID);
  const {
    member,
    memberUniqueId,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressFields,
    membershipExpiryLabel,
    membershipStartLabel,
    isLoading,
    error,
    refetch,
  } =
    useMemberDetailPage();

  useEffect(() => {
    const availableTabIds = [MEMBER_DETAIL_TAB_ID, ...customFormSections.map((section) => section.id)];
    const hasCurrentTab = availableTabIds.includes(activeDetailTabId);
    const nextActiveTabId = hasCurrentTab ? activeDetailTabId : MEMBER_DETAIL_TAB_ID;

    if (nextActiveTabId !== activeDetailTabId) {
      setActiveDetailTabId(nextActiveTabId);
    }
  }, [activeDetailTabId, customFormSections]);

  const activeCustomFormSection = useMemo(
    () => customFormSections.find((section) => section.id === activeDetailTabId) ?? null,
    [activeDetailTabId, customFormSections],
  );

  const isMemberDetailTabActive = activeDetailTabId === MEMBER_DETAIL_TAB_ID;

  if (error && !memberUniqueId) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-cyan-50 via-white to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              to={APP_ROUTES.membershipMembers}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <ArrowLeft size={16} />
              Back to members
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border border-cyan-100 bg-gradient-to-br from-cyan-600 to-sky-500 text-xl font-semibold text-white shadow-lg shadow-cyan-100 sm:h-24 sm:w-24">
                {member?.profile.photoUrl ? (
                  <img
                    src={member.profile.photoUrl}
                    alt={fullName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                    Member detail
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {fullName}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Review the member&apos;s profile, membership status, and submitted registration responses in one place.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>{error}</div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : member ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} detail={card.detail} tone={card.tone} />
            ))}
          </div>

          <div
            role="tablist"
            aria-label="Member detail tabs"
            className="flex w-full flex-wrap items-stretch gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isMemberDetailTabActive}
              onClick={() => setActiveDetailTabId(MEMBER_DETAIL_TAB_ID)}
              className={cn(
                "inline-flex min-w-[12rem] flex-1 basis-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-center transition",
                isMemberDetailTabActive
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-900",
              )}
            >
              <span>Member Detail</span>
            </button>

            {customFormSections.map((section) => {
              const isActive = section.id === activeCustomFormSection?.id;

              return (
                <button
                  key={section.id}
                  type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDetailTabId(section.id)}
                className={cn(
                  "inline-flex min-w-[12rem] flex-1 basis-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-center transition",
                  isActive
                    ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200"
                    : "text-slate-600 hover:bg-white hover:text-slate-900",
                )}
                >
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="space-y-6">
              {isMemberDetailTabActive ? (
                <div className="space-y-6">
                  <div className="grid items-stretch gap-6 xl:grid-cols-2">
                    <DetailPanel
                      className="h-full"
                      title="Profile and contact"
                      description="Core identity information and communication channels that help organizers verify the member at a glance."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <InfoRow icon={<UserRound size={16} />} label="Name" value={fullName} />
                        <InfoRow icon={<Mail size={16} />} label="Email" value={member.contact.email} href={`mailto:${member.contact.email}`} />
                        <InfoRow icon={<Phone size={16} />} label="Phone" value={member.contact.cellPhone || "Not provided"} href={member.contact.cellPhone ? `tel:${member.contact.cellPhone}` : undefined} />
                      </div>

                      {addressFields.length > 0 ? (
                        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</p>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {addressFields.map((field) => (
                              <InfoRow
                                key={field.label}
                                icon={getAddressFieldIcon(field.label)}
                                label={field.label}
                                value={field.value}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </DetailPanel>

                    <DetailPanel
                      className="h-full"
                      title="Membership snapshot"
                      description="A concise view of the member's current standing and the most important lifecycle dates."
                    >
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current plan</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{member.membership.activeMembershipName || "Not assigned"}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Expiry</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{membershipExpiryLabel}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Record notes</p>
                          <p className={cn("mt-2 text-sm leading-6", member.membership.notes ? "text-slate-700" : "text-slate-500")}>
                            {member.membership.notes || "No notes provided with this member record."}
                          </p>
                        </div>
                      </div>
                    </DetailPanel>
                  </div>

                  {customQuestionResponses.length > 0 ? (
                    <DetailPanel
                      title="Custom questions"
                      description="Individual question responses captured at registration time."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        {customQuestionResponses.map((item) => (
                          <article key={item.questionUniqueId || item.questionLabel} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {item.controlType || "Question"}
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-slate-900">
                              {item.questionLabel || "Unnamed question"}
                            </h3>
                            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                              {item.optionLabel ? <p><span className="font-medium text-slate-900">Selected:</span> {item.optionLabel}</p> : null}
                              {renderCustomQuestionAnswer(item)}
                            </div>
                          </article>
                        ))}
                      </div>
                    </DetailPanel>
                  ) : null}

                </div>
                ) : activeCustomFormSection ? (
                  <div key={activeCustomFormSection.id} className="space-y-4">
                    {activeCustomFormSection.description ? (
                      <p className="text-sm leading-6 text-slate-600">{activeCustomFormSection.description}</p>
                    ) : null}

                    <div className={getCustomFormGridClass()}>
                      {activeCustomFormSection.items.map((item, index) => (
                        <article
                          key={`${item.fieldUniqueId ?? item.fieldLabel}-${item.value}`}
                          className={cn(
                            "group relative space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5",
                            getCustomFormFieldSpanClass(activeCustomFormSection.layoutColumn, item.fieldLayoutColumn),
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.fieldLabel || "Unnamed field"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            {renderCustomFormAnswer(item, activeCustomFormSection.items, index)}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <EmptyStatePanel
            title="Member record unavailable"
            description="We couldn't find a member record to show. Try returning to the members list and opening another profile."
          />
        </div>
      )}
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        {label}
      </div>
      <p className={cn("mt-3 text-sm leading-6 text-slate-700", mono ? "font-mono text-xs break-all" : "font-medium")}>
        {value}
      </p>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} className="block transition hover:-translate-y-0.5 hover:shadow-md">
      {content}
    </a>
  );
}

function renderCustomFormAnswer(
  item: MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null },
  sectionItems: Array<MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null }>,
  index: number,
) {
  if (item.fileStorageUniqueId) {
    return (
      <AttachmentCard
        fileUniqueId={item.fileStorageUniqueId}
        fileName={item.fileOriginalFileName}
        contentType={item.fileContentType}
        fileSize={item.fileSize}
        fallbackLabel={item.value || item.fieldLabel}
      />
    );
  }

  const controlType = item.fieldDefinition
    ? getCustomFormControlType(item.fieldDefinition.formControlTypeId)
    : normalizeControlType(item.fieldType);

  switch (controlType) {
    case "checkbox":
      return <ReadOnlyCheckboxValue value={item.value} />;
    case "radio":
      return <ReadOnlyRadioValue value={item.value} options={item.fieldDefinition?.options ?? []} />;
    case "multiselect":
      return <ReadOnlyMultiSelectValue value={item.value} options={item.fieldDefinition?.options ?? []} />;
    case "country":
      return <ReadOnlyCountryValue value={item.value} />;
    case "state":
      return (
        <ReadOnlyStateValue
          countryValue={getNearestCountryValue(sectionItems, index)}
          value={item.value}
        />
      );
    case "password":
      return <ReadOnlyPasswordValue value={item.value} />;
    case "textarea":
      return <ReadOnlyTextareaValue value={item.value} />;
    default:
      return <p className="text-sm leading-6 text-slate-700">{renderCustomFormValue(item.value)}</p>;
  }
}

function renderCustomQuestionAnswer(
  item: MembershipMemberCustomQuestionAnswer & { questionDefinition: MembershipRegistrationCustomQuestion | null },
) {
  if (item.fileStorageUniqueId) {
    return (
      <AttachmentCard
        fileUniqueId={item.fileStorageUniqueId}
        fileName={item.fileOriginalFileName}
        contentType={item.fileContentType}
        fileSize={item.fileSize}
        fallbackLabel={item.value || item.questionLabel}
      />
    );
  }

  const controlType = item.questionDefinition
    ? getCustomQuestionControlType(item.questionDefinition.controlType)
    : normalizeControlType(item.controlType);

  switch (controlType) {
    case "checkbox":
      return <ReadOnlyCheckboxValue value={item.value ?? ""} />;
    case "radio":
      return <ReadOnlyRadioValue value={item.value ?? item.optionLabel ?? ""} options={item.questionDefinition?.options ?? []} />;
    case "multiselect":
      return <ReadOnlyMultiSelectValue value={item.value ?? ""} options={item.questionDefinition?.options ?? []} />;
    case "country":
      return <ReadOnlyCountryValue value={item.value ?? ""} />;
    case "state":
      return <ReadOnlyStateValue countryValue={null} value={item.value ?? ""} />;
    case "password":
      return <ReadOnlyPasswordValue value={item.value ?? ""} />;
    case "textarea":
      return <ReadOnlyTextareaValue value={item.value ?? ""} />;
    default:
      return item.value ? <p>{item.value}</p> : null;
  }
}

function ReadOnlyCheckboxValue({ value }: { value: string }) {
  const checked = value.trim().toLowerCase() === "true" || value.trim() === "1";

  return (
    <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} readOnly disabled className="h-4 w-4 accent-cyan-600" />
      <span>{checked ? "Checked" : "Unchecked"}</span>
    </label>
  );
}

function ReadOnlyPasswordValue({ value }: { value: string }) {
  return (
    <input
      type="password"
      value={value}
      readOnly
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
    />
  );
}

function ReadOnlyTextareaValue({ value }: { value: string }) {
  return (
    <textarea
      value={value}
      readOnly
      rows={4}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none"
    />
  );
}

function ReadOnlyRadioValue({
  value,
  options,
}: {
  value: string;
  options: MembershipRegistrationCustomQuestionOption[];
}) {
  const selectedValues = parseSelectedValues(value);
  const fallbackValue = value.trim();

  if (options.length === 0) {
    return <p className="text-sm leading-6 text-slate-700">{fallbackValue || "No value provided"}</p>;
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected =
          selectedValues.includes(option.value) ||
          selectedValues.includes(option.uniqueId) ||
          selectedValues.includes(option.displayText) ||
          fallbackValue === option.value ||
          fallbackValue === option.uniqueId ||
          fallbackValue === option.displayText;

        return (
          <label key={option.uniqueId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="radio" checked={isSelected} readOnly disabled className="h-4 w-4 accent-cyan-600" />
            <span>{option.displayText}</span>
          </label>
        );
      })}
    </div>
  );
}

function ReadOnlyMultiSelectValue({
  value,
  options,
}: {
  value: string;
  options: MembershipRegistrationCustomQuestionOption[];
}) {
  const selectedValues = parseSelectedValues(value);

  if (options.length === 0) {
    return selectedValues.length > 0 ? (
      <span className="inline-flex flex-wrap gap-2">
        {selectedValues.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {item}
          </span>
        ))}
      </span>
    ) : (
      <p className="text-sm leading-6 text-slate-400">No value provided</p>
    );
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected =
          selectedValues.includes(option.value) ||
          selectedValues.includes(option.uniqueId) ||
          selectedValues.includes(option.displayText);

        return (
          <label key={option.uniqueId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={isSelected} readOnly disabled className="h-4 w-4 accent-cyan-600" />
            <span>{option.displayText}</span>
          </label>
        );
      })}
    </div>
  );
}

function ReadOnlyCountryValue({ value }: { value: string }) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    void fetchCountryOptions().then((nextOptions) => {
      if (!cancelled) {
        setOptions(nextOptions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedOptions = useMemo(() => {
    if (!value.trim()) {
      return options;
    }

    return options.some((option) => option.value === value)
      ? options
      : [{ label: value, value }, ...options];
  }, [options, value]);

  return (
    <select
      value={value}
      disabled
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
    >
      <option value="">{resolvedOptions.length > 0 ? "Select country" : value || "No value provided"}</option>
      {resolvedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ReadOnlyStateValue({
  countryValue,
  value,
}: {
  countryValue: string | null;
  value: string;
}) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    if (!countryValue?.trim()) {
      setOptions([]);
      return () => {
        cancelled = true;
      };
    }

    void fetchStateOptions(countryValue).then((nextOptions) => {
      if (!cancelled) {
        setOptions(nextOptions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [countryValue]);

  const resolvedOptions = useMemo(() => {
    if (!value.trim()) {
      return options;
    }

    return options.some((option) => option.value === value)
      ? options
      : [{ label: value, value }, ...options];
  }, [options, value]);

  return (
    <select
      value={value}
      disabled
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
    >
      <option value="">
        {countryValue?.trim()
          ? resolvedOptions.length > 0
            ? "Select state"
            : value || "No value provided"
          : value || "Select a country first"}
      </option>
      {resolvedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AttachmentCard({
  fileUniqueId,
  fileName,
  contentType,
  fileSize,
  fallbackLabel,
}: {
  fileUniqueId: string;
  fileName: string | null;
  contentType: string | null;
  fileSize: number | null;
  fallbackLabel: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = Boolean(contentType?.toLowerCase().startsWith("image/"));
  const displayName = fileName || fallbackLabel || "Attachment";
  const viewUrl = `/api/organizer/membership/type/members/files/${fileUniqueId}`;
  const downloadUrl = `/api/organizer/membership/type/members/files/${fileUniqueId}/download`;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!isImage) {
      setPreviewUrl(null);
      return () => {
        cancelled = true;
      };
    }

    void openBinaryFile(viewUrl)
      .then((url) => {
        if (cancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isImage, viewUrl]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
          {isImage ? <Image size={18} /> : <FileText size={18} />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-medium text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-500">{formatAttachmentMeta(contentType, fileSize)}</p>
        </div>
      </div>

      {isImage ? (
        previewUrl ? (
          <button
            type="button"
            onClick={() => {
              window.open(previewUrl, "_blank", "noopener,noreferrer");
            }}
            className="block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <img src={previewUrl} alt={displayName} className="max-h-64 w-full object-cover" />
          </button>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            Loading preview...
          </div>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (isImage && previewUrl) {
              window.open(previewUrl, "_blank", "noopener,noreferrer");
              return;
            }

            void openBinaryFile(viewUrl).then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
              window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
            });
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <ExternalLink size={14} />
          Open
        </button>
        <button
          type="button"
          onClick={() => {
            void downloadBinaryFile(downloadUrl, fileName || fallbackLabel || "download");
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  );
}

function formatAttachmentMeta(contentType: string | null, fileSize: number | null) {
  const contentTypeLabel = contentType?.trim() || "Unknown type";
  const sizeLabel = fileSize !== null ? formatFileSize(fileSize) : "Unknown size";
  return `${contentTypeLabel} • ${sizeLabel}`;
}

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function renderCustomFormValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return <span className="text-slate-400">No value provided</span>;
  }

  return <span className="whitespace-pre-wrap">{trimmedValue}</span>;
}

function getNearestCountryValue(
  items: Array<MembershipMemberCustomFormAnswer & { fieldDefinition: MembershipRegistrationCustomFormField | null }>,
  currentIndex: number,
) {
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = items[index];
    if (!candidate) {
      continue;
    }

    const candidateType = candidate.fieldDefinition
      ? getCustomFormControlType(candidate.fieldDefinition.formControlTypeId)
      : normalizeControlType(candidate.fieldType);

    if (candidateType !== "country") {
      continue;
    }

    const candidateValue = candidate.value?.trim();
    if (candidateValue) {
      return candidateValue;
    }
  }

  return null;
}
