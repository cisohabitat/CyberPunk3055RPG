import { allocationResponse } from "../notice-allocation";
import authored from "../../content/notice.json";
import { compileMission } from "../authoring";

export const NOTICE_SCENES = compileMission(authored);

// The authored observation remains authoritative; the planned split adds a
// conduct response, not another delivery or appointment result.
const replyText = NOTICE_SCENES.act3_notice_visit.text;
NOTICE_SCENES.act3_notice_visit.text = (state) => `${typeof replyText === "function" ? replyText(state) : replyText}${allocationResponse(state) ? `\n\n${allocationResponse(state)}` : ""}`;
