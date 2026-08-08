import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container-page py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="font-display text-sm font-semibold">
            LiveCaption Hub
          </span>
          <span className="text-xs text-muted-foreground ml-3">© 2026</span>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <a href="#" className="hover:text-foreground">
            Docs
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
