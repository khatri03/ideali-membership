import { Link } from "react-router-dom";
import { APP_ROUTES } from "../routes";

export function CustomFormsPage() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Custom Forms</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Build and manage membership forms here.
          </p>
        </div>

        <Link
          to={APP_ROUTES.customFormsCreate}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Create
        </Link>
      </div>
    </section>
  );
}
