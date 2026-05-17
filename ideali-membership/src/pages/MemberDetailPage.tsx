import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, FileText, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../routes";
import { cn } from "../lib/utils";
import { EmptyStatePanel, DetailPanel, StatCard, StatusPill } from "./MemberDetailPage.parts";
import { useMemberDetailPage } from "./MemberDetailPage.hooks";

type MemberTone = "slate" | "cyan" | "emerald" | "amber" | "rose";

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusTone(status: string): MemberTone {
  switch (status) {
    case "Active":
      return "emerald";
    case "PendingApproval":
    case "Pending":
      return "amber";
    case "Expired":
      return "rose";
    case "InActive":
    case "NearExpiry":
      return "cyan";
    default:
      return "slate";
  }
}

export function MemberDetailPage() {
  const {
    member,
    memberUniqueId,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressLines,
    membershipExpiryLabel,
    membershipStartLabel,
    isLoading,
    error,
    refetch,
  } =
    useMemberDetailPage();

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
              <div className="grid h-16 w-16 place-items-center rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-600 to-sky-500 text-lg font-semibold text-white shadow-lg shadow-cyan-100">
                {member?.memberPhotoUrl ? (
                  <img
                    src={member.memberPhotoUrl}
                    alt={fullName}
                    className="h-full w-full rounded-[1.5rem] object-cover"
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

                {member ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={member.membershipStatus || "Unknown"} tone={getStatusTone(member.membershipStatus)} />
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {member.activeMembershipName || "Membership not assigned"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      ID {member.uniqueId}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {member ? (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                <Mail size={16} />
                Email member
              </a>
              {member.cellPhone ? (
                <a
                  href={`tel:${member.cellPhone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <Phone size={16} />
                  Call member
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(member.uniqueId)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <ShieldCheck size={16} />
                Copy member ID
              </button>
            </div>
          ) : null}
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

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailPanel
                title="Profile and contact"
                description="Core identity information and communication channels that help organizers verify the member at a glance."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow icon={<UserRound size={16} />} label="Name" value={member.memberFullName} />
                  <InfoRow icon={<Mail size={16} />} label="Email" value={member.email} href={`mailto:${member.email}`} />
                  <InfoRow icon={<Phone size={16} />} label="Phone" value={member.cellPhone || "Not provided"} href={member.cellPhone ? `tel:${member.cellPhone}` : undefined} />
                  <InfoRow icon={<CalendarDays size={16} />} label="Membership start" value={membershipStartLabel} />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoRow icon={<FileText size={16} />} label="Member ID" value={member.uniqueId} mono />
                  <InfoRow icon={<ShieldCheck size={16} />} label="Status" value={member.membershipStatus} />
                </div>

                {addressLines.length > 0 ? (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</p>
                    <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
                      {addressLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </DetailPanel>

              <DetailPanel
                title="Custom forms"
                description="Responses grouped by the form they came from during registration."
              >
                {customFormSections.length > 0 ? (
                  <div className="space-y-4">
                    {customFormSections.map((section) => (
                      <div key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                        <div className="mt-4 grid gap-3">
                          {section.items.map((item) => (
                            <div key={`${item.fieldUniqueId ?? item.fieldLabel}-${item.value}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {item.fieldType || "Field"}
                              </p>
                              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <p className="font-medium text-slate-900">{item.fieldLabel || "Unnamed field"}</p>
                                <p className="text-sm leading-6 text-slate-700 sm:max-w-[60%] sm:text-right">{item.value || "No value"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyStatePanel
                    title="No custom form responses"
                    description="This membership record does not currently include any saved form responses."
                  />
                )}
              </DetailPanel>

              <DetailPanel
                title="Custom questions"
                description="Individual question responses captured at registration time."
              >
                {customQuestionResponses.length > 0 ? (
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
                          {item.value ? <p>{item.value}</p> : null}
                          {item.fileStorageId ? <p className="text-xs font-medium text-slate-500">File attachment #{item.fileStorageId}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyStatePanel
                    title="No custom question responses"
                    description="No question answers were returned for this member record."
                  />
                )}
              </DetailPanel>
            </div>

            <aside className="space-y-6">
              <DetailPanel
                title="Membership snapshot"
                description="A concise view of the member's current standing and the most important lifecycle dates."
              >
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current plan</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{member.activeMembershipName || "Not assigned"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Expiry</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{membershipExpiryLabel}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Record notes</p>
                    <p className={cn("mt-2 text-sm leading-6", member.notes ? "text-slate-700" : "text-slate-500")}>
                      {member.notes || "No notes provided with this member record."}
                    </p>
                  </div>
                </div>
              </DetailPanel>

              <DetailPanel
                title="Operational actions"
                description="These links support the most common organizer workflows without leaving the detail page."
              >
                <div className="grid gap-3">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    <Mail size={16} />
                    Send message
                  </a>
                  <Link
                    to={APP_ROUTES.membershipMembers}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <ArrowLeft size={16} />
                    Return to members list
                  </Link>
                </div>
              </DetailPanel>
            </aside>
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
