import { TableType } from "./types";

export const SERVICE_ORIGIN = "https://gw.test.newdesigner.ai/designer-service";
const APICheckTemplate = `${SERVICE_ORIGIN}/tool/check/card_template`;
const APICheckInvitation = `${SERVICE_ORIGIN}/tool/check/invitation_template`;
const APICheckPostcard = `${SERVICE_ORIGIN}/tool/check/postcard_template`;

const APICheckAIPoster = `${SERVICE_ORIGIN}/tool/check/general_template`;
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
    checkApi: APICheckInvitation,
    apiPath: `${SERVICE_ORIGIN}/tool/add/invitation_template`,
  },
  "AI poster模版-Postcard": {
    checkApi: APICheckPostcard,
    apiPath: `${SERVICE_ORIGIN}/tool/add/postcard_template`,
  },
  "AI poster模版-Poster": {
    checkApi: APICheckAIPoster,
    apiPath: `${SERVICE_ORIGIN}/tool/add/general_template`,
  },
  "AI poster场景": {},
  "AI poster预设": {},
};
