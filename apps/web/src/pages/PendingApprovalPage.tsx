import { Hourglass01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { useAuthContext } from "../context/AuthContext";

export function PendingApprovalPage() {
  const { signOutUser } = useAuthContext();

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <EmptyState size="lg">
        <EmptyState.Header>
          <EmptyState.FeaturedIcon icon={Hourglass01} color="warning" theme="light" />
        </EmptyState.Header>

        <EmptyState.Content>
          <EmptyState.Title>Account Pending Approval</EmptyState.Title>
          <EmptyState.Description>
            Your account has been created but is awaiting administrator approval.
            You will receive access once an admin assigns your role.
          </EmptyState.Description>
        </EmptyState.Content>

        <EmptyState.Footer>
          <Button size="md" color="secondary" onClick={signOutUser}>
            Sign Out
          </Button>
        </EmptyState.Footer>
      </EmptyState>
    </div>
  );
}
