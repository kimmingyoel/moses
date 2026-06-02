export const MAX_MEMBERS = 20;
export const MAX_MEMBER_INPUT_LENGTH = 160;

export function parseMemberNames(rawName: string): string[] {
  return rawName
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

export function limitMemberNamesForAdd(
  rawName: string,
  currentMemberCount: number,
): string[] {
  const remainingSlots = Math.max(MAX_MEMBERS - currentMemberCount, 0);
  if (remainingSlots === 0) return [];
  return parseMemberNames(rawName).slice(0, remainingSlots);
}
