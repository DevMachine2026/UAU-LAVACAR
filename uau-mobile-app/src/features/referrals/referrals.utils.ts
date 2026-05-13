import { AnyRecord, asArray, asRecord, getNestedRecord, getNumber } from "@/utils/data";

export function normalizeReferralLine(network: unknown, line: 1 | 2 | 3) {
  const record = asRecord(network);
  const keys = [`line${line}`, `linha${line}`, `level${line}`, `nivel${line}`];

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;

    const nested = asRecord(value);
    const nestedItems = asArray(nested.items ?? nested.users ?? nested.data);
    if (nestedItems.length > 0) return nestedItems;
  }

  const lines = getNestedRecord(record, ["lines", "linhas", "levels"]);
  for (const key of keys) {
    const value = lines[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    const nestedItems = asArray(nested.items ?? nested.users ?? nested.data);
    if (nestedItems.length > 0) return nestedItems;
  }

  return [];
}

export function getLineTotal(network: unknown, line: 1 | 2 | 3) {
  const record = asRecord(network);
  const totals = getNestedRecord(record, ["totals", "totais", "totalByLine"]);
  return (
    getNumber(totals, [`line${line}`, `linha${line}`, `level${line}`, `nivel${line}`], Number.NaN) ||
    normalizeReferralLine(record, line).length
  );
}

export function getLineEarnings(network: unknown, line: 1 | 2 | 3) {
  const record = asRecord(network);
  const earnings = getNestedRecord(record, ["earnings", "ganhos", "earningsByLine"]);
  return getNumber(earnings, [`line${line}`, `linha${line}`, `level${line}`, `nivel${line}`], 0);
}

export function normalizeTreeNode(value: unknown): AnyRecord {
  const record = asRecord(value);
  const root = record.root ?? record.tree ?? record.data;
  return Object.keys(asRecord(root)).length > 0 ? asRecord(root) : record;
}

export function getTreeChildren(node: AnyRecord) {
  return asArray(node.children ?? node.indications ?? node.referrals ?? node.directs);
}
