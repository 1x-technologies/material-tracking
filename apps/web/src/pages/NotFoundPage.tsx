import { Link } from "react-router";
import { SearchRefraction } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <EmptyState size="lg">
        <EmptyState.Header>
          <EmptyState.FeaturedIcon icon={SearchRefraction} color="gray" theme="light" />
        </EmptyState.Header>

        <EmptyState.Content>
          <EmptyState.Title>Page Not Found</EmptyState.Title>
          <EmptyState.Description>
            The page you are looking for does not exist or has been moved.
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
