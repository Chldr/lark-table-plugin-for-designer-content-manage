import { ITable } from "@lark-base-open/js-sdk";

export type TableType = (typeof tableNames)[number];
export type TableDataType = {
  id: string;
  name: string;
  table: ITable | null;
};
export const tableNames = [
  "模版",
  "预设(IPAdapter)",
  "风格",
  "AI poster模版",
  "AI poster场景",
  "AI poster预设",
] as const;
