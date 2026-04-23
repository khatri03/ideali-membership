import type { RefObject } from "react";
import { MEMBERSHIP_COLOR_CONTENT, MEMBERSHIP_COLOR_SWATCHES } from "./MembershipColorStepPage.fields";
import { useMembershipColorStep } from "./MembershipColorStepPage.hook";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7.5 13.1 4.9 10.5l-1.4 1.4 4 4 8-8-1.4-1.4z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M9 3h2v6h6v2h-6v6H9v-6H3V9h6z" />
    </svg>
  );
}

function MembershipColorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="grid w-fit grid-cols-4 gap-1.5">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 sm:h-[4.5rem] sm:w-[4.5rem]" />
        ))}
      </div>
    </div>
  );
}

function MembershipColorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
          !
        </div>
        <div className="space-y-2">
          <p>{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function MembershipColorSwatch({
  label,
  value,
  isSelected,
  onSelect,
}: {
  label: string;
  value: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]">
      <button
        type="button"
        title={label}
        aria-pressed={isSelected}
        onClick={onSelect}
        className={[
          "relative h-full w-full cursor-pointer rounded-2xl border border-transparent transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
          isSelected ? "shadow-[0_0_0_2px_rgba(15,23,42,0.18)]" : "hover:brightness-95",
        ].join(" ")}
        style={{ backgroundColor: value }}
      >
        {isSelected ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
              <CheckIcon />
            </span>
          </span>
        ) : null}
      </button>
    </div>
  );
}

function MembershipColorCustomTile({
  customColor,
  onOpenPicker,
  inputRef,
  onChange,
}: {
  customColor: string | null;
  onOpenPicker: () => void;
  inputRef: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]">
      <button
        type="button"
        title={MEMBERSHIP_COLOR_CONTENT.customTitle}
        aria-pressed={Boolean(customColor)}
        onClick={onOpenPicker}
        className={[
          "relative h-full w-full cursor-pointer rounded-2xl border transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
          customColor
            ? "border-transparent shadow-[0_0_0_2px_rgba(15,23,42,0.18)]"
            : "border-dashed border-slate-400 bg-slate-50 text-slate-600 hover:border-slate-500 hover:bg-slate-100",
        ].join(" ")}
        style={customColor ? { backgroundColor: customColor } : undefined}
      >
        {customColor ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
              <CheckIcon />
            </span>
          </span>
        ) : (
          <span className="inline-flex h-full w-full items-center justify-center">
            <PlusIcon />
          </span>
        )}

        <input
          ref={inputRef}
          type="color"
          value={customColor ?? "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function MembershipColorArrowTile() {
  return (
    <div className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" aria-hidden="true">
      <div className="flex h-full w-full items-center justify-start rounded-2xl pl-1.5 sm:pl-2">
        <svg
          viewBox="0 0 40 16"
          className="h-4 w-11 text-cyan-700/70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M38 8H10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 3L10 8L15 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export function MembershipColorStepPage() {
  const {
    selectedPresetColor,
    customColor,
    hasInteractedWithCustomColor,
    error,
    isLoading,
    isSaving,
    reload,
    selectPresetColor,
    openCustomColorPicker,
    updateCustomColor,
    customColorInputRef,
  } = useMembershipColorStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipColorError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        Membership wizard step
      </div>

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_COLOR_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_COLOR_CONTENT.description}</p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <MembershipColorSkeleton />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{MEMBERSHIP_COLOR_CONTENT.helper}</p>

            <fieldset disabled={isSaving} className="space-y-3">
              <div className="grid w-fit grid-cols-4 gap-1.5">
                {MEMBERSHIP_COLOR_SWATCHES.map((color) => {
                  const isSelected = selectedPresetColor === color.value;

                  return (
                    <MembershipColorSwatch
                      key={color.value}
                      label={color.label}
                      value={color.value}
                      isSelected={isSelected}
                      onSelect={() => selectPresetColor(color.value)}
                    />
                  );
                })}

                <MembershipColorCustomTile
                  customColor={customColor}
                  onOpenPicker={openCustomColorPicker}
                  inputRef={customColorInputRef}
                  onChange={updateCustomColor}
                />

                {!hasInteractedWithCustomColor ? <MembershipColorArrowTile /> : null}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </section>
  );
}
