import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display text-lg font-semibold tracking-tight">
            LiveCaption <span className="text-signal">Hub</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            hash="features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            to="/"
            hash="how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            to="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Pricing
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_24px_var(--signal-glow)]"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
