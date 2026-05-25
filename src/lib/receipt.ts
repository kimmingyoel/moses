export type ReceiptCurrency = "KRW" | "JPY" | "USD" | "EUR" | "UNKNOWN";

export type ImageQuality =
  | "clear"
  | "cropped"
  | "blurry"
  | "rotated"
  | "low_light"
  | "unknown";

export type ReceiptExtractionOption = {
  name: string;
  quantity: number;
  unitPriceDelta: number;
  totalPriceDelta: number;
  confidence: number;
  rawText: string;
};

export type ReceiptExtractionItem = {
  name: string;
  quantity: number;
  baseUnitPrice: number;
  unitPrice: number;
  totalPrice: number;
  options: ReceiptExtractionOption[];
  confidence: number;
  rawText: string;
};

export type ReceiptExtractionAdjustment = {
  name: string;
  amount: number;
  confidence: number;
  rawText: string;
};

export type ReceiptExtraction = {
  merchantName: string;
  purchasedAt: string;
  currency: ReceiptCurrency;
  items: ReceiptExtractionItem[];
  adjustments: ReceiptExtractionAdjustment[];
  subtotal: number;
  totalAmount: number;
  imageQuality: ImageQuality;
  warnings: string[];
};

export type ReviewFlagCode =
  | "removed_zero_price_option"
  | "removed_zero_total_component"
  | "auto_corrected_line_total"
  | "auto_filled_subtotal"
  | "replaced_tax_base_subtotal"
  | "unclear_image"
  | "model_warning"
  | "low_confidence"
  | "unsupported_currency"
  | "manual_total_override"
  | "line_total_differs_from_unit_price";

export type BlockingErrorCode =
  | "schema_invalid"
  | "invalid_item_fields"
  | "invalid_adjustment_fields"
  | "line_total_mismatch"
  | "receipt_total_mismatch"
  | "missing_total_amount"
  | "no_items"
  | "member_count_invalid"
  | "unassignable_fractional_units"
  | "unassigned_item_units";

export type ReviewFlag = {
  code: ReviewFlagCode;
  message: string;
  itemId?: string;
  adjustmentId?: string;
};

export type BlockingError = {
  code: BlockingErrorCode;
  message: string;
  itemId?: string;
  adjustmentId?: string;
  delta?: number;
};

export type SettlementOption = ReceiptExtractionOption & {
  id: string;
};

export type SettlementItem = {
  id: string;
  name: string;
  quantity: number;
  baseUnitPrice: number;
  unitPrice: number;
  totalPrice: number;
  options: SettlementOption[];
  rawText: string;
  confidence: number;
  reviewFlags: ReviewFlag[];
};

export type Adjustment = {
  id: string;
  name: string;
  amount: number;
  rawText: string;
  confidence: number;
};

export type ReceiptDraft = {
  rawExtractionId: string;
  merchantName: string;
  purchasedAt: string;
  currency: ReceiptCurrency;
  items: SettlementItem[];
  adjustments: Adjustment[];
  subtotal: number;
  totalAmount: number;
  itemTotal: number;
  adjustmentTotal: number;
  reconciliationDelta: number;
  reviewFlags: ReviewFlag[];
  blockingErrors: BlockingError[];
};

export type Member = {
  id: string;
  name: string;
};

export type AssignableItemUnit = {
  id: string;
  itemId: string;
  name: string;
  unitIndex: number;
  unitAmount: number;
};

export type Assignment = {
  itemUnitId: string;
  memberIds: string[];
};

export type SettlementMemberItem = {
  itemUnitId: string;
  itemId: string;
  name: string;
  amount: number;
  sharedWith: number;
};

export type SettlementMemberResult = {
  memberId: string;
  memberName: string;
  grossItemTotal: number;
  adjustmentTotal: number;
  finalAmount: number;
  items: SettlementMemberItem[];
};

export type SettlementResult = {
  members: SettlementMemberResult[];
  grandTotal: number;
  blockingErrors: BlockingError[];
};

type ValidationResult =
  | { ok: true; value: ReceiptExtraction }
  | { ok: false; errors: BlockingError[] };

const currencies = new Set<ReceiptCurrency>([
  "KRW",
  "JPY",
  "USD",
  "EUR",
  "UNKNOWN",
]);

const imageQualities = new Set<ImageQuality>([
  "clear",
  "cropped",
  "blurry",
  "rotated",
  "low_light",
  "unknown",
]);

const CONFIDENCE_THRESHOLD = 0.8;

export function validateReceiptExtraction(input: unknown): ValidationResult {
  const errors: BlockingError[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: [schemaError("Extraction response must be an object.")],
    };
  }

  const required = [
    "merchantName",
    "purchasedAt",
    "currency",
    "items",
    "adjustments",
    "subtotal",
    "totalAmount",
    "imageQuality",
    "warnings",
  ] as const;

  for (const key of required) {
    if (!(key in input)) errors.push(schemaError(`Missing field: ${key}.`));
  }

  if (errors.length > 0) return { ok: false, errors };

  if (typeof input.merchantName !== "string") {
    errors.push(schemaError("merchantName must be a string."));
  }
  if (typeof input.purchasedAt !== "string") {
    errors.push(schemaError("purchasedAt must be a string."));
  }
  if (typeof input.currency !== "string" || !currencies.has(input.currency as ReceiptCurrency)) {
    errors.push(schemaError("currency is not supported."));
  }
  if (typeof input.imageQuality !== "string" || !imageQualities.has(input.imageQuality as ImageQuality)) {
    errors.push(schemaError("imageQuality is not supported."));
  }
  if (!Number.isInteger(input.subtotal)) {
    errors.push(schemaError("subtotal must be an integer."));
  }
  if (!Number.isInteger(input.totalAmount)) {
    errors.push(schemaError("totalAmount must be an integer."));
  }
  if (!Array.isArray(input.warnings) || !input.warnings.every((x) => typeof x === "string")) {
    errors.push(schemaError("warnings must be a string array."));
  }
  if (!Array.isArray(input.items)) {
    errors.push(schemaError("items must be an array."));
  } else {
    input.items.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(schemaError(`items[${index}] must be an object.`));
        return;
      }
      for (const field of [
        "name",
        "quantity",
        "baseUnitPrice",
        "unitPrice",
        "totalPrice",
        "options",
        "confidence",
        "rawText",
      ] as const) {
        if (!(field in item)) errors.push(schemaError(`items[${index}].${field} is missing.`));
      }
      if (typeof item.name !== "string") errors.push(schemaError(`items[${index}].name must be a string.`));
      if (!Number.isInteger(item.quantity)) errors.push(schemaError(`items[${index}].quantity must be an integer.`));
      if (!Number.isInteger(item.baseUnitPrice)) errors.push(schemaError(`items[${index}].baseUnitPrice must be an integer.`));
      if (!Number.isInteger(item.unitPrice)) errors.push(schemaError(`items[${index}].unitPrice must be an integer.`));
      if (!Number.isInteger(item.totalPrice)) errors.push(schemaError(`items[${index}].totalPrice must be an integer.`));
      if (typeof item.confidence !== "number") errors.push(schemaError(`items[${index}].confidence must be a number.`));
      if (typeof item.rawText !== "string") errors.push(schemaError(`items[${index}].rawText must be a string.`));
      if (!Array.isArray(item.options)) {
        errors.push(schemaError(`items[${index}].options must be an array.`));
      } else {
        item.options.forEach((option, optionIndex) => {
          if (!isRecord(option)) {
            errors.push(schemaError(`items[${index}].options[${optionIndex}] must be an object.`));
            return;
          }
          if (typeof option.name !== "string") errors.push(schemaError(`items[${index}].options[${optionIndex}].name must be a string.`));
          if (!Number.isInteger(option.quantity)) errors.push(schemaError(`items[${index}].options[${optionIndex}].quantity must be an integer.`));
          if (!Number.isInteger(option.unitPriceDelta)) errors.push(schemaError(`items[${index}].options[${optionIndex}].unitPriceDelta must be an integer.`));
          if (!Number.isInteger(option.totalPriceDelta)) errors.push(schemaError(`items[${index}].options[${optionIndex}].totalPriceDelta must be an integer.`));
          if (typeof option.confidence !== "number") errors.push(schemaError(`items[${index}].options[${optionIndex}].confidence must be a number.`));
          if (typeof option.rawText !== "string") errors.push(schemaError(`items[${index}].options[${optionIndex}].rawText must be a string.`));
        });
      }
    });
  }
  if (!Array.isArray(input.adjustments)) {
    errors.push(schemaError("adjustments must be an array."));
  } else {
    input.adjustments.forEach((adjustment, index) => {
      if (!isRecord(adjustment)) {
        errors.push(schemaError(`adjustments[${index}] must be an object.`));
        return;
      }
      if (typeof adjustment.name !== "string") errors.push(schemaError(`adjustments[${index}].name must be a string.`));
      if (!Number.isInteger(adjustment.amount)) errors.push(schemaError(`adjustments[${index}].amount must be an integer.`));
      if (typeof adjustment.confidence !== "number") errors.push(schemaError(`adjustments[${index}].confidence must be a number.`));
      if (typeof adjustment.rawText !== "string") errors.push(schemaError(`adjustments[${index}].rawText must be a string.`));
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as ReceiptExtraction };
}

export function normalizeReceiptExtraction(
  raw: ReceiptExtraction,
  rawExtractionId: string,
  confidenceThreshold = CONFIDENCE_THRESHOLD,
): ReceiptDraft {
  const reviewFlags: ReviewFlag[] = [];
  const blockingErrors: BlockingError[] = [];

  const sourceItems =
    raw.items.length > 1
      ? raw.items.filter((item, index) => {
          if (item.totalPrice !== 0) return true;
          reviewFlags.push({
            code: "removed_zero_total_component",
            message: "Zero-total child/component row was removed.",
            itemId: itemId(index),
          });
          return false;
        })
      : raw.items;

  const items = sourceItems.map((item, index) => {
    const id = itemId(index);
    const itemFlags: ReviewFlag[] = [];
    const options: SettlementOption[] = [];

    item.options.forEach((option, optionIndex) => {
      if (option.totalPriceDelta === 0) {
        itemFlags.push({
          code: "removed_zero_price_option",
          message: "Zero-priced option was removed.",
          itemId: id,
        });
        return;
      }
      options.push({
        ...option,
        id: `${id}_option_${optionIndex + 1}`,
        name: option.name.trim(),
      });
    });

    let totalPrice = item.totalPrice;
    const hasInvalidFields =
      item.name.trim().length === 0 ||
      !isPositiveInteger(item.quantity) ||
      !isNonNegativeInteger(item.baseUnitPrice) ||
      !isNonNegativeInteger(item.unitPrice) ||
      !isNonNegativeInteger(item.totalPrice);

    if (hasInvalidFields) {
      blockingErrors.push({
        code: "invalid_item_fields",
        message: "Item has empty or invalid required fields.",
        itemId: id,
      });
    } else {
      const optionDelta = options.reduce((sum, option) => sum + option.totalPriceDelta, 0);
      const expectedTotalFromOptions = item.quantity * item.baseUnitPrice + optionDelta;
      const expectedTotalFromUnit = item.quantity * item.unitPrice;
      const hasPaidOptions = options.length > 0;
      const totalMatchesOptions = expectedTotalFromOptions === item.totalPrice;
      const totalMatchesUnit = expectedTotalFromUnit === item.totalPrice;

      if ((hasPaidOptions && totalMatchesOptions) || (!hasPaidOptions && totalMatchesUnit)) {
        totalPrice = item.totalPrice;
      } else if (expectedTotalFromOptions === expectedTotalFromUnit) {
        totalPrice = expectedTotalFromUnit;
        itemFlags.push({
          code: "auto_corrected_line_total",
          message: "Line total was corrected from quantity and unit price.",
          itemId: id,
        });
      } else {
        blockingErrors.push({
          code: "line_total_mismatch",
          message: "Line total does not match quantity, unit price, and options.",
          itemId: id,
          delta: item.totalPrice - expectedTotalFromUnit,
        });
      }
    }

    if (item.confidence < confidenceThreshold) {
      itemFlags.push({
        code: "low_confidence",
        message: "Item confidence is below the review threshold.",
        itemId: id,
      });
    }

    reviewFlags.push(...itemFlags);

    return {
      id,
      name: item.name.trim(),
      quantity: item.quantity,
      baseUnitPrice: item.baseUnitPrice,
      unitPrice: item.unitPrice,
      totalPrice,
      options,
      rawText: item.rawText,
      confidence: item.confidence,
      reviewFlags: itemFlags,
    };
  });

  const adjustments = raw.adjustments.map((adjustment, index) => {
    const id = adjustmentId(index);
    if (!Number.isInteger(adjustment.amount) || adjustment.name.trim().length === 0) {
      blockingErrors.push({
        code: "invalid_adjustment_fields",
        message: "Adjustment has empty or invalid required fields.",
        adjustmentId: id,
      });
    }
    if (adjustment.confidence < confidenceThreshold) {
      reviewFlags.push({
        code: "low_confidence",
        message: "Adjustment confidence is below the review threshold.",
        adjustmentId: id,
      });
    }
    return {
      id,
      name: adjustment.name.trim(),
      amount: adjustment.amount,
      rawText: adjustment.rawText,
      confidence: adjustment.confidence,
    };
  });

  let subtotal = raw.subtotal;
  const itemTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const adjustmentTotal = adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);

  if (subtotal === 0 && itemTotal > 0) {
    subtotal = itemTotal;
    reviewFlags.push({
      code: "auto_filled_subtotal",
      message: "Missing subtotal was filled from item totals.",
    });
  } else if (
    subtotal !== itemTotal &&
    itemTotal + adjustmentTotal === raw.totalAmount &&
    subtotal > 0 &&
    subtotal < itemTotal
  ) {
    subtotal = itemTotal;
    reviewFlags.push({
      code: "replaced_tax_base_subtotal",
      message: "Tax-base subtotal was replaced with item subtotal.",
    });
  }

  const reconciliationDelta = itemTotal + adjustmentTotal - raw.totalAmount;

  if (raw.imageQuality !== "clear") {
    reviewFlags.push({
      code: "unclear_image",
      message: `Receipt image quality is ${raw.imageQuality}.`,
    });
  }
  raw.warnings.forEach((warning) => {
    reviewFlags.push({
      code: "model_warning",
      message: warning,
    });
  });
  if (raw.currency === "UNKNOWN" || raw.currency !== "KRW") {
    reviewFlags.push({
      code: "unsupported_currency",
      message: "Currency should be reviewed before settlement.",
    });
  }
  if (raw.totalAmount === 0) {
    blockingErrors.push({
      code: "missing_total_amount",
      message: "Final total amount is missing.",
    });
  }
  if (items.length === 0) {
    blockingErrors.push({
      code: "no_items",
      message: "Receipt has no purchasable items.",
    });
  }
  if (reconciliationDelta !== 0) {
    blockingErrors.push({
      code: "receipt_total_mismatch",
      message: "Item subtotal plus adjustments does not equal final total.",
      delta: reconciliationDelta,
    });
  }

  return {
    rawExtractionId,
    merchantName: raw.merchantName.trim(),
    purchasedAt: raw.purchasedAt,
    currency: raw.currency,
    items,
    adjustments,
    subtotal,
    totalAmount: raw.totalAmount,
    itemTotal,
    adjustmentTotal,
    reconciliationDelta,
    reviewFlags,
    blockingErrors,
  };
}

export function createAssignableUnits(items: SettlementItem[]): {
  units: AssignableItemUnit[];
  blockingErrors: BlockingError[];
} {
  const units: AssignableItemUnit[] = [];
  const blockingErrors: BlockingError[] = [];

  for (const item of items) {
    if (!isPositiveInteger(item.quantity) || item.totalPrice % item.quantity !== 0) {
      blockingErrors.push({
        code: "unassignable_fractional_units",
        message: "Item total does not divide cleanly by quantity.",
        itemId: item.id,
      });
      continue;
    }
    const unitAmount = item.totalPrice / item.quantity;
    for (let i = 0; i < item.quantity; i += 1) {
      units.push({
        id: `${item.id}_unit_${i + 1}`,
        itemId: item.id,
        name: item.name,
        unitIndex: i + 1,
        unitAmount,
      });
    }
  }

  return { units, blockingErrors };
}

export function calculateSettlement(
  draft: ReceiptDraft,
  members: Member[],
  assignments: Assignment[],
): SettlementResult {
  const blockingErrors: BlockingError[] = [];

  if (members.length < 2 || members.length > 20 || members.some((member) => member.name.trim().length === 0)) {
    blockingErrors.push({
      code: "member_count_invalid",
      message: "Settlement requires 2 to 20 named members.",
    });
  }

  const assignable = createAssignableUnits(draft.items);
  blockingErrors.push(...draft.blockingErrors, ...assignable.blockingErrors);

  const unitById = new Map(assignable.units.map((unit) => [unit.id, unit]));
  const assignedUnitIds = new Set(assignments.map((assignment) => assignment.itemUnitId));

  for (const unit of assignable.units) {
    if (!assignedUnitIds.has(unit.id)) {
      blockingErrors.push({
        code: "unassigned_item_units",
        message: "All item units must be assigned before settlement.",
        itemId: unit.itemId,
      });
    }
  }

  if (blockingErrors.length > 0) {
    return {
      members: members.map((member) => emptyMemberResult(member)),
      grandTotal: 0,
      blockingErrors,
    };
  }

  const memberOrder = new Map(members.map((member, index) => [member.id, index]));
  const memberShares = new Map<string, { gross: number; items: SettlementMemberItem[] }>(
    members.map((member) => [member.id, { gross: 0, items: [] }]),
  );

  for (const assignment of assignments) {
    const unit = unitById.get(assignment.itemUnitId);
    if (!unit) continue;
    const participantIds = stableUniqueIds(assignment.memberIds, memberOrder);
    if (participantIds.length === 0) continue;

    const split = splitIntegerByWeight(
      unit.unitAmount,
      participantIds.map((id) => ({ id, weight: 1 })),
      memberOrder,
    );

    participantIds.forEach((memberId) => {
      const amount = split.get(memberId) ?? 0;
      const share = memberShares.get(memberId);
      if (!share) return;
      share.gross += amount;
      share.items.push({
        itemUnitId: unit.id,
        itemId: unit.itemId,
        name: unit.name,
        amount,
        sharedWith: participantIds.length,
      });
    });
  }

  const totalGross = Array.from(memberShares.values()).reduce((sum, share) => sum + share.gross, 0);
  const adjustmentShares = splitIntegerByWeight(
    draft.adjustmentTotal,
    members.map((member) => ({
      id: member.id,
      weight: totalGross === 0 ? 1 : (memberShares.get(member.id)?.gross ?? 0),
    })),
    memberOrder,
  );

  const results = members.map((member) => {
    const share = memberShares.get(member.id) ?? { gross: 0, items: [] };
    const adjustmentTotal = adjustmentShares.get(member.id) ?? 0;
    return {
      memberId: member.id,
      memberName: member.name,
      grossItemTotal: share.gross,
      adjustmentTotal,
      finalAmount: share.gross + adjustmentTotal,
      items: share.items,
    };
  });

  return {
    members: results,
    grandTotal: results.reduce((sum, result) => sum + result.finalAmount, 0),
    blockingErrors,
  };
}

export function isReviewReady(draft: ReceiptDraft, memberCount: number): boolean {
  return (
    draft.items.length > 0 &&
    memberCount >= 2 &&
    draft.reconciliationDelta === 0 &&
    draft.blockingErrors.length === 0
  );
}

export function formatSettlementClipboard(result: SettlementResult): string {
  const lines = [
    "모세 정산 결과",
    "----------",
    ...result.members.map((member) => `${member.memberName}: ₩${member.finalAmount.toLocaleString("ko-KR")}`),
    "----------",
    `총합: ₩${result.grandTotal.toLocaleString("ko-KR")}`,
  ];
  return lines.join("\n");
}

function splitIntegerByWeight(
  amount: number,
  weights: { id: string; weight: number }[],
  memberOrder: Map<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  if (weights.length === 0) return result;

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) {
    weights.forEach((item) => result.set(item.id, 0));
    return result;
  }

  const exactShares = weights.map((item) => {
    const exact = (amount * item.weight) / totalWeight;
    const floored = Math.floor(exact);
    return {
      id: item.id,
      floored,
      remainder: exact - floored,
      order: memberOrder.get(item.id) ?? Number.MAX_SAFE_INTEGER,
    };
  });

  let remainder = amount - exactShares.reduce((sum, item) => sum + item.floored, 0);
  exactShares.forEach((item) => result.set(item.id, item.floored));

  const direction = remainder >= 0 ? 1 : -1;
  remainder = Math.abs(remainder);
  const ranked = [...exactShares].sort((a, b) => {
    const remainderDiff =
      direction > 0 ? b.remainder - a.remainder : a.remainder - b.remainder;
    if (remainderDiff !== 0) return remainderDiff;
    return a.order - b.order;
  });

  for (let i = 0; i < remainder; i += 1) {
    const winner = ranked[i % ranked.length];
    result.set(winner.id, (result.get(winner.id) ?? 0) + direction);
  }

  return result;
}

function stableUniqueIds(ids: string[], memberOrder: Map<string, number>): string[] {
  return Array.from(new Set(ids)).sort(
    (a, b) =>
      (memberOrder.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (memberOrder.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

function schemaError(message: string): BlockingError {
  return { code: "schema_invalid", message };
}

function itemId(index: number): string {
  return `item_${index + 1}`;
}

function adjustmentId(index: number): string {
  return `adjustment_${index + 1}`;
}

function emptyMemberResult(member: Member): SettlementMemberResult {
  return {
    memberId: member.id,
    memberName: member.name,
    grossItemTotal: 0,
    adjustmentTotal: 0,
    finalAmount: 0,
    items: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
