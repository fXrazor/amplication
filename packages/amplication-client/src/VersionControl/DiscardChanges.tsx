import { useCallback, useContext } from "react";
import { ConfirmationDialog, Snackbar } from "@amplication/ui/design-system";
import * as models from "../models";
import { gql, useMutation } from "@apollo/client";
import { formatError } from "../util/error";
import "./DiscardChanges.scss";
import { AppContext } from "../context/appContext";
import { AnalyticsEventNames } from "../util/analytics-events.types";
import { useTracking } from "../util/analytics";

type Props = {
  isOpen: boolean;
  projectId: string;
  resourceTypeGroup: models.EnumResourceTypeGroup;
  onComplete: () => void;
  onDismiss: () => void;
};

const DiscardChanges = ({
  isOpen,
  projectId,
  resourceTypeGroup,
  onComplete,
  onDismiss,
}: Props) => {
  const { trackEvent } = useTracking();

  const { pendingChanges, resetPendingChanges, addEntity } =
    useContext(AppContext);
  const [discardChanges, { error, loading }] = useMutation(DISCARD_CHANGES, {
    update(cache, { data }) {
      if (!data) return;

      //remove entities from cache to reflect discarded changes
      for (const change of pendingChanges) {
        if (change.originType === models.EnumPendingChangeOriginType.Entity) {
          cache.evict({
            id: cache.identify({
              id: change.originId,
              __typename: "Entity",
            }),
          });
        } else {
          const block = change.origin as models.Block;

          cache.evict({
            id: cache.identify({
              id: change.originId,
              __typename: block.blockType,
            }),
          });
        }
      }
    },
    onCompleted: (data) => {
      resetPendingChanges();
      onComplete();
      addEntity(projectId); // data.project.connect.id
    },
  });

  const handleConfirm = useCallback(() => {
    trackEvent({
      eventName: AnalyticsEventNames.PendingChangesDiscard,
    });

    discardChanges({
      variables: {
        projectId,
        resourceTypeGroup,
      },
    }).catch(console.error);
  }, [trackEvent, discardChanges, projectId, resourceTypeGroup]);

  const errorMessage = formatError(error);

  return (
    <>
      <ConfirmationDialog
        isOpen={isOpen}
        title="Discard Changes"
        confirmButton={{
          label: "Discard",
          disabled: loading,
        }}
        dismissButton={{
          label: "Cancel",
        }}
        message={
          <div>
            <div>This action cannot be undone. </div>
            <div>
              This will permanently delete the resource and its content. Are you
              sure you want to continue?
            </div>
          </div>
        }
        onConfirm={handleConfirm}
        onDismiss={onDismiss}
      />
      <Snackbar open={Boolean(error)} message={errorMessage} />
    </>
  );
};

export default DiscardChanges;

const DISCARD_CHANGES = gql`
  mutation discardChanges(
    $projectId: String!
    $resourceTypeGroup: EnumResourceTypeGroup!
  ) {
    discardPendingChanges(
      data: {
        project: { connect: { id: $projectId } }
        resourceTypeGroup: $resourceTypeGroup
      }
    )
  }
`;
