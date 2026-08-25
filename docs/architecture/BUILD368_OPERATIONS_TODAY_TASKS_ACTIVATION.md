# Build 368 — Operations Today Tasks Activation

Build 368 supplies the real admin page for the Operations route that was already present in the domain catalog:

```text
/admin/today-tasks/
```

## Loader order

The page loads:

```text
/public/js/admin.js?v=368
/public/js/admin-today-tasks.js?v=368
```

Core therefore classifies and activates the Commerce & Operations wrapper before the Today Tasks UI performs its automatic GET.

## UI behavior

The dedicated page displays:

- Today task groups across catalog, custom requests, orders, inventory, accounting and runtime health;
- category filtering;
- schema/readiness warnings when a source query cannot run;
- drill-through links to the owning workspaces;
- explicit Done, Ignore and Snooze buttons.

Automatic load is GET-only through Build 366. Done/Ignore/Snooze continues to use the retained POST authority only after an explicit administrator click.

## Ownership

Build 368 moves no mutation authority and changes no Production branch or Production D1/R2 state.
