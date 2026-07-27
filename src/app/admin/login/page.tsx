export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-display text-xl text-bone">HydroCore Admin</p>
        <form method="POST" action="/api/admin/login" className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-bone-dim">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="mt-2 w-full border border-slate-line bg-transparent px-4 py-3 text-base text-bone focus:border-brass-lite focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-alert-text">
              Incorrect password.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-brass px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass-lite"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
