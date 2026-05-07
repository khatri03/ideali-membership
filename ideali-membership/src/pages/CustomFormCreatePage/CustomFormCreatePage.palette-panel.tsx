import type { CustomFormControl } from "../../types/customForms";
import { ControlPaletteItem } from "./index";

export function CustomFormCreatePagePalettePanel({
  controlSearch,
  controls,
  controlsError,
  filteredControls,
  controlUsageCounts,
  isLoadingControls,
  appendFieldToCanvas,
  setControlSearch,
}: {
  controlSearch: string;
  controls: CustomFormControl[];
  controlsError: string | null;
  filteredControls: CustomFormControl[];
  controlUsageCounts: Map<number, number>;
  isLoadingControls: boolean;
  appendFieldToCanvas: (control: CustomFormControl) => void;
  setControlSearch: (value: string) => void;
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Field palette</h2>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Search field types
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
              <span className="text-slate-400" aria-hidden="true">
                /
              </span>
              <input
                type="text"
                value={controlSearch}
                onChange={(event) => setControlSearch(event.target.value)}
                placeholder="Search by name or type"
                className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {controlSearch ? (
                <button
                  type="button"
                  onClick={() => setControlSearch("")}
                  className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </label>
        </div>

        <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1 sm:max-h-[28rem] lg:max-h-[32rem]">
          {isLoadingControls ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          ) : controlsError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{controlsError}</div>
          ) : filteredControls.length > 0 ? (
            filteredControls.map((control) => (
              <ControlPaletteItem
                key={control.id}
                control={control}
                count={controlUsageCounts.get(control.id) ?? 0}
                onDoubleClick={appendFieldToCanvas}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {controls.length > 0 ? "No controls match your search." : "No controls were returned by the backend."}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50/80 p-4 sm:p-5">
        <p className="text-sm font-semibold text-slate-900">Builder note</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start with the core controls first. We can progressively add advanced settings, validation rules, and
          persistence after the structure is stable.
        </p>
      </div>
    </aside>
  );
}
