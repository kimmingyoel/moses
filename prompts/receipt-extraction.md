# Receipt Extraction Prompt

Extract structured purchase data from receipt images for a split-payment app.
Return only the supplied JSON schema. Use visible or strongly implied data only;
do not invent items, prices, quantities, merchant names, or dates.

## Core Rules

- Preserve item names as printed. Do not translate, normalize spelling, or guess a
  more likely menu name. Remove only obvious leading bullets, arrows, or OCR junk.
- Extract purchase line items only. Exclude payment methods, card approvals, tax
  summaries, points, receipt/order/table numbers, store metadata, phone/address,
  and business registration rows.
- If quantity is not explicit, use `quantity: 1`.
- Use integer amounts without commas or currency symbols. Supported currencies:
  `KRW`, `JPY`, `USD`, `EUR`, `UNKNOWN`.
- `baseUnitPrice`: per-unit price before visible paid options. If no paid option,
  it equals `unitPrice`.
- `unitPrice`: final per-unit settlement price after visible paid options.
- `totalPrice`: settlement line amount before receipt-level adjustments:
  `quantity * unitPrice`.
- If quantity and unit price are visible, `totalPrice` must be
  `quantity * unitPrice` even when the receipt also shows discounted allocated
  row amounts. Put the discount only in `adjustments`.
- Use negative amounts only in `adjustments`, never in `items` or `options`.
- Put discounts, coupons, service charges, delivery/takeout fees, and manual
  corrections in `adjustments` unless clearly normal purchasable items.

## Totals

- `totalAmount` is the final customer payment amount. Prefer rows like `합계`,
  `총액`, `받을금액`, `결제금액`, `승인금액`.
- `subtotal` is the item sum before receipt-level adjustments. If no true subtotal
  is printed but item rows reconcile, set `subtotal` to `sum(items.totalPrice)`.
- Never use tax-base or VAT-exclusive rows as `subtotal`: `공급가액`, `과세`,
  `면세`, `부가세`, `부가가치세`.
- Self-check before final output:
  `sum(items.totalPrice) + sum(adjustments.amount) == totalAmount` when the
  final amount is visible or exactly inferable.
- If totals cannot reconcile because the image is cropped or unclear, use the
  best visible values and add a warning.

## Options

- Attach visible paid child/add-on rows to the nearest parent item when they
  change that item's price. Common markers: indentation, `+`, `추가`, `변경`,
  `교환`, `>>`, arrows.
- For multiple paid options on one parent:
  `unitPrice = baseUnitPrice + sum(option.unitPriceDelta)` and
  `totalPrice = quantity * baseUnitPrice + sum(option.totalPriceDelta)`.
- Omit zero-priced child rows, set components, cup choices, water exchanges,
  free toppings, and descriptive modifiers.
- Do not output options with `unitPriceDelta: 0` or `totalPriceDelta: 0`; omit
  them entirely and leave `options: []` if no paid options remain.
- Rows using marker syntax such as `-->`, `{{{{ ... }}}}`, `| ... |`, or `|<`
  are usually free modifiers. Omit them unless the row clearly has its own
  positive add-on price that reconciles with the parent total.
- A normal menu row with its own positive line price is a standalone item, not an
  option for the previous item. A following paid add-on belongs to that menu row.
- Never create negative option deltas to force reconciliation. Coupons and
  discounts are `adjustments`, not options.
- Never create standalone zero-priced items unless the zero-priced row is the
  only meaningful purchase row.

## Compact Examples

- Set option: `[세트] 데리야키 쉑 1 15,100` with `>>바닐라 쉐이크 1 3,600`
  becomes one item: base `15100`, unit/total `18700`, one option `+3600`.
  Omit zero-priced set components such as fries or base burger rows.
- Coupon: `통새우와퍼세트 10,000`, paid options `+500` and `+500`, coupon
  `-2,000` becomes item total `11000`, adjustment `-2000`, total `9000`.
- Standalone add-on: `카이센 마제소바 16,000`, `카메미소라멘 11,000`,
  `수비드차슈 2,000` becomes two items; attach `수비드차슈 +2000` to
  `카메미소라멘`, not to `카이센 마제소바`.
- Tax rows: if item rows sum to `18,500` and `공급가액` is `16,818`, use
  `subtotal: 18500`, not `16818`.

## Warnings and Confidence

- Add warnings for cropped, blurry, rotated, partially hidden, multiple-receipt,
  ambiguous OCR, inferred totals, or unreconciled totals.
- Confidence is per extracted line, from `0` to `1`.
