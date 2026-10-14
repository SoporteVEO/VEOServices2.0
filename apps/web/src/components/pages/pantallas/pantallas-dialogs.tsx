"use client";

import { AttentionDeleteDialog } from "./attention-delete-dialog";
import { CampaignDetailDialog } from "./campaign-detail-dialog";
import { CampaignFormDialog } from "./campaign-form-dialog";
import { DeleteCampaignDialog } from "./delete-campaign-dialog";
import { OrderIntakeDialog } from "./order-intake-dialog";
import { OrderReportDialog } from "./order-report-dialog";
import type { PantallasDialogState } from "./pantallas-context";
import { ScreenFormDialog } from "./screen-form-dialog";
import { SublistFormDialog } from "./sublist-form-dialog";

export function PantallasDialogs({
  dialog,
  onClose,
}: {
  dialog: PantallasDialogState;
  onClose: () => void;
}) {
  return (
    <>
      <CampaignFormDialog
        open={dialog?.type === "campaign"}
        sublistId={dialog?.type === "campaign" ? dialog.sublistId : null}
        campaignId={dialog?.type === "campaign" ? dialog.campaignId : null}
        onClose={onClose}
      />
      <CampaignDetailDialog
        campaignId={dialog?.type === "campaignDetail" ? dialog.campaignId : null}
        onClose={onClose}
      />
      <DeleteCampaignDialog
        campaignId={dialog?.type === "deleteCampaign" ? dialog.campaignId : null}
        onClose={onClose}
      />
      <AttentionDeleteDialog
        groupKey={dialog?.type === "attentionDelete" ? dialog.groupKey : null}
        onClose={onClose}
      />
      <SublistFormDialog
        sublistId={dialog?.type === "sublist" ? dialog.sublistId : null}
        onClose={onClose}
      />
      <ScreenFormDialog
        open={dialog?.type === "screen"}
        screenId={dialog?.type === "screen" ? dialog.screenId : null}
        onClose={onClose}
      />
      <OrderIntakeDialog open={dialog?.type === "order"} onClose={onClose} />
      <OrderReportDialog open={dialog?.type === "report"} onClose={onClose} />
    </>
  );
}
