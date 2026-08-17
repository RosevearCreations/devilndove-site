# Build 271 Validation — CAIP operator clarity and complete derivative-plan access

Build 271 is a CAIP UI/documentation release on top of Build 270 recovery presentation and the Build 269 CAIP schema. **No D1 migration is added.**

Validated:

- the Creative projects sidebar now has an **Open CAIP project** selector sourced from the same `creative_projects` result as the project-row panel, so standalone/social projects without `content_project_id` remain selectable;
- the Content Studio package selector is isolated inside **Create / refresh from Content Studio**, preventing it from being mistaken for the project selector;
- derivative plans are no longer truncated with `slice(0, 6)`;
- all derivative plans render inside a keyboard-focusable bounded scroll region;
- `planned` derivative rows sort before already-approved rows so pending approvals remain reachable;
- the page includes a plain-language **Where you are in CAIP** workflow guide with live counts for registered source assets, safe probes, plans, approvals, evidence and story segments;
- operator guidance explicitly states that a safe probe does not watch/analyze footage, a derivative plan does not render an output, plan approval does not publish, and a derivative plan is optional per source;
- CAIP authoritative Markdown now includes `18_Operator_Workflow_Guide.md` and updates the standalone/social workflow;
- browser cache bust advanced to Build 271 for the Creative Assets workspace;
- JavaScript syntax checks pass;
- CAIP regressions pass for Builds 241 and 265–271.

Database boundary: Build 269 migration remains authoritative; no Build 271 D1 schema change is required.
