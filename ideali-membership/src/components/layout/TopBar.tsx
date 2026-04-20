import { useAuth } from "../../auth/AuthContext";

interface TopBarProps {
  isNavVisible: boolean;
  onNavToggle: () => void;
}

export function TopBar({ isNavVisible, onNavToggle }: TopBarProps) {
  const { session, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onNavToggle}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          aria-label={isNavVisible ? "Hide navigation sidebar" : "Show navigation sidebar"}
          aria-pressed={isNavVisible}
        >
          <span className="space-y-1">
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="block h-0.5 w-4 rounded-full bg-current" />
          </span>
          <span className="hidden sm:inline">
            {isNavVisible ? "Hide sidebar" : "Show sidebar"}
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <span className="text-sm font-bold">I</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[0.2em] text-cyan-700 uppercase">
              Ideali Membership
            </p>
            <p className="truncate text-sm text-slate-500">
              Signed in as {session?.userDetail.name || session?.userDetail.email}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session?.organizerDetail.emailBrandingEnabled ? (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
              Branding enabled
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
