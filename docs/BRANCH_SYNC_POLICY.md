# Temporary Branch Synchronization Policy

Until the owner changes this direction, Devil n Dove source updates use the following release sequence:

1. Implement on `dev`.
2. Require the exact `dev` SHA to pass the applicable source gates, including System Gate.
3. Confirm the exact SHA has no failed or still-running required workflows.
4. Fast-forward `main` non-force to that same SHA.
5. Require Production Pages deployment and post-deploy live-resource proof before calling the update fully live.

This policy does not authorize force pushes, destructive Production database changes, R2 deletion, or replacement of differing R2 objects.
