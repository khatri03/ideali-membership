import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES, buildCustomFormEditPath } from "../app/routes";
import { useCustomFormsPageData } from "./CustomFormsPage/CustomFormsPage.hooks";
import { CustomFormTableRow } from "./CustomFormsPage/CustomFormsPage.row";

export function CustomFormsPage() {
  const navigate = useNavigate();
  const { forms, isLoading, error, formCountLabel } = useCustomFormsPageData();

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Custom Forms
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Manage reusable form templates
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Keep organizer forms organized, reusable, and ready to open in the custom form designer.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{formCountLabel}</p>
          </div>

          <Link
            to={APP_ROUTES.customFormsCreate}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Open designer
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : forms.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th scope="col" className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Header text
                    </th>
                    <th scope="col" className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Mapped fields
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {forms.map((form) => (
                    <CustomFormTableRow key={form.uniqueId} form={form} onEdit={(uniqueId) => navigate(buildCustomFormEditPath(uniqueId))} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-semibold text-slate-900">No custom forms yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Create a reusable custom form and it will appear here for editing later.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

