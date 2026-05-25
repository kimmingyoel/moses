import type {
  Assignment,
  Member,
  ReceiptDraft,
  SettlementItem,
} from "@/lib/receipt";

export type SplitSession = {
  id: string;
  status:
    | "draft"
    | "extracting"
    | "needs_review"
    | "assigning"
    | "settled"
    | "extraction_failed";
  members: Member[];
  receipt: ReceiptDraft | null;
  confirmedReceipt: ReceiptDraft | null;
  assignments: Assignment[];
  uploadFileName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "moses.splitSession";

export function createSession(): SplitSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    status: "draft",
    members: [],
    receipt: null,
    confirmedReceipt: null,
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadSession(): SplitSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SplitSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: SplitSession): SplitSession {
  const next = { ...session, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function updateSession(
  updater: (session: SplitSession) => SplitSession,
): SplitSession {
  return saveSession(updater(loadSession() ?? createSession()));
}

export function updateReceiptItems(
  draft: ReceiptDraft,
  items: Pick<SettlementItem, "id" | "name" | "quantity" | "unitPrice">[],
  totalAmount: number,
): ReceiptDraft {
  const nextItems = draft.items
    .filter((item) => items.some((candidate) => candidate.id === item.id))
    .map((item) => {
      const edited = items.find((candidate) => candidate.id === item.id);
      if (!edited) return item;
      return {
        ...item,
        name: edited.name.trim(),
        quantity: edited.quantity,
        baseUnitPrice: edited.unitPrice,
        unitPrice: edited.unitPrice,
        totalPrice: edited.quantity * edited.unitPrice,
        options: [],
        reviewFlags: [],
      };
    });

  const itemTotal = nextItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const adjustmentTotal = draft.adjustments.reduce(
    (sum, adjustment) => sum + adjustment.amount,
    0,
  );
  const reconciliationDelta = itemTotal + adjustmentTotal - totalAmount;

  return {
    ...draft,
    items: nextItems,
    subtotal: itemTotal,
    totalAmount,
    itemTotal,
    adjustmentTotal,
    reconciliationDelta,
    reviewFlags:
      totalAmount !== draft.totalAmount
        ? [
            ...draft.reviewFlags,
            {
              code: "manual_total_override",
              message: "Final total was edited during review.",
            },
          ]
        : draft.reviewFlags,
    blockingErrors:
      nextItems.length === 0
        ? [{ code: "no_items", message: "Receipt has no purchasable items." }]
        : reconciliationDelta !== 0
          ? [
              {
                code: "receipt_total_mismatch",
                message:
                  "Item subtotal plus adjustments does not equal final total.",
                delta: reconciliationDelta,
              },
            ]
          : [],
  };
}
