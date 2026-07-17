---
name: postgres-materialized-view-refresh
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/reviewing-oracle-to-postgres-migration/references/postgres-materialized-view-refresh.md
license: MIT
domain: developer
---

# postgres-materialized-view-refresh

# PostgreSQL Materialized View Refresh Guide

Purpose: Ensure migrated applications keep materialized views current after base-table changes.

## Problem

PostgreSQL materialized views are static snapshots. Updates to source tables do **not** automatically refresh dependent materialized views.

## Migration risk

- Oracle-era assumptions that derived data updates immediately may no longer hold.
- Read paths can return stale rows unless refresh timing is explicitly managed.
- Integration tests may pass once and then fail intermittently if refresh sequencing is not deterministic.

## Required review item

For every migrated path that writes to tables feeding a materialized view, verify the application workflow includes an explicit refresh strategy.

## Refresh patterns

- Immediate refresh in the write workflow when freshness is required:
  ```sql
  REFRESH MATERIALIZED VIEW my_view;
  ```
- Concurrent refresh (when supported and indexed) to reduce read blocking:
  ```sql
  REFRESH MATERIALIZED VIEW CONCURRENTLY my_view;
  ```
- Scheduled/batch refresh when stale windows are acceptable.

## Integration-test expectations

- [ ] Tests that modify source tables assert materialized-view contents only after the intended refresh action.
- [ ] Tests assert stale behavior before refresh when applicable.
- [ ] Tests document whether freshness is immediate or eventual for each affected feature.


## Reference (reference.md)

# Reference Index

| File | Brief description |
| --- | --- |
| [empty-strings-handling.md](empty-strings-handling.md) | Oracle treats '' as NULL; PostgreSQL keeps empty strings distinct—patterns to align behavior in code, tests, and migrations. |
| [no-data-found-exceptions.md](no-data-found-exceptions.md) | Oracle SELECT INTO raises "no data found"; PostgreSQL doesn’t—add explicit NOT FOUND handling to mirror Oracle behavior. |
| [oracle-parentheses-from-clause.md](oracle-parentheses-from-clause.md) | Oracle allows `FROM(TABLE_NAME)` syntax; PostgreSQL requires `FROM TABLE_NAME`—remove unnecessary parentheses around table names. |
| [oracle-to-postgres-sorting.md](oracle-to-postgres-sorting.md) | How to preserve Oracle-like ordering in PostgreSQL using COLLATE "C" and DISTINCT wrapper patterns. |
| [oracle-to-postgres-to-char-numeric.md](oracle-to-postgres-to-char-numeric.md) | Oracle allows TO_CHAR(numeric) without format; PostgreSQL requires format string—use CAST(numeric AS TEXT) instead. |
| [oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) | PostgreSQL strict type checks vs. Oracle implicit coercion—fix comparison errors by quoting or casting literals. |
| [postgres-union-all-planner.md](postgres-union-all-planner.md) | UNION ALL branches can produce poor plans when predicate pushdown is limited—review plans and split or reshape queries when needed. |
| [postgres-materialized-view-refresh.md](postgres-materialized-view-refresh.md) | Materialized views are not auto-refreshed after base-table changes—application or jobs must explicitly refresh them. |
| [postgres-concurrent-transactions.md](postgres-concurrent-transactions.md) | PostgreSQL allows only one active command per connection—materialize results or use separate connections to avoid concurrent operation errors. |
| [postgres-refcursor-handling.md](postgres-refcursor-handling.md) | Differences in refcursor handling; PostgreSQL requires fetching by cursor name—C# patterns to unwrap and read results. |
| [oracle-to-postgres-timestamp-timezone.md](oracle-to-postgres-timestamp-timezone.md) | CURRENT_TIMESTAMP / NOW() return UTC-normalised timestamptz in PostgreSQL; Npgsql surfaces DateTime.Kind=Unspecified—force UTC at connection open and in application code. |
