import { TableType } from "./types";

export const SERVICE_ORIGIN = "https://gw.test.newdesigner.ai/designer-service";
const APICheckTemplate = `${SERVICE_ORIGIN}/tool/check/template`;
const APICheckInvitationAndPostcard = `${SERVICE_ORIGIN}/tool/poster/check/template`;
const APICheckAIPoster = `${SERVICE_ORIGIN}/tool/poster/prompt/check/template`;
export const tableConfig: Record<
  TableType,
  {
    apiPath?: string;
    checkApi?: string;
  }
> = {
  模版: {
    apiPath: "/tool/template",
    checkApi: APICheckTemplate,
  },
  "预设(IPAdapter)": {
    apiPath: "/tool/preset",
  },
  风格: {
    apiPath: "/tool/style",
  },
  "AI poster模版- Invitation": {
    checkApi: APICheckInvitationAndPostcard,
  },
  "AI poster模版-Postcard": {
    checkApi: APICheckInvitationAndPostcard,
  },
  "AI poster模版-Poster": {
    checkApi: APICheckAIPoster,
  },
  "AI poster场景": {},
  "AI poster预设": {},
};
