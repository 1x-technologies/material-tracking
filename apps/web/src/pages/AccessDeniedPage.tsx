import { Link } from "react-router";
import { Lock01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";

export function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <EmptyState size="lg">
        <EmptyState.Header>
          <EmptyState.FeaturedIcon icon={Lock01} color="error" theme="light" />
        </EmptyState.Header>

        <EmptyState.Content>
          <EmptyState.Title>Access Denied</EmptyState.Title>
          <EmptyState.Description>
            You do not have permission to view this page.
            Contact an administrator if you believe this is an error.
          </EmptyState.Description>
        </EmptyState.Content>

        <EmptyState.Footer>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-solid px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset transition duration-100 ease-linear hover:bg-brand-solid_hover before:absolute before:inset-px before:border before:border-white/12 before:rounded-[7px] before:mask-b-from-0%"
          >
            Go to Dashboard
          </Link>
        </EmptyState.Footer>
      </EmptyState>
    </div>
  );
}
