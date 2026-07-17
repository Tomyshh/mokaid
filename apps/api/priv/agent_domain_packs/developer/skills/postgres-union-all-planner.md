---
name: postgres-union-all-planner
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/reviewing-oracle-to-postgres-migration/references/postgres-union-all-planner.md
license: MIT
domain: developer
---

# postgres-union-all-planner

# PostgreSQL UNION ALL Planner Risk Guide

Purpose: Avoid regressions where migrated `UNION ALL` queries run much slower in PostgreSQL than expected.

## Problem

`UNION ALL` keeps duplicate rows and combines branch outputs directly, but PostgreSQL does not always optimize each branch as aggressively as isolated queries. In large datasets this can produce poor plans (for example full scans where index-based plans are expected).

## Why it happens

- Predicate pushdown through `UNION ALL` branches can be limited depending on query shape.
- Cardinality estimates across branches can be skewed.
- Branch-local indexes may not be chosen when the optimizer evaluates the combined query.

## Review checklist

- [ ] Compare `EXPLAIN (ANALYZE, BUFFERS)` plans for the combined `UNION ALL` query and branch-isolated variants.
- [ ] Confirm branch predicates are explicit and not hidden inside non-sargable expressions.
- [ ] Check for unexpected sequential scans on large tables in either branch.
- [ ] Verify indexes exist for each branch's filter and join predicates.

## Mitigation patterns

1. Test each branch independently to verify expected index usage.
2. Push filters down into each branch instead of only filtering in the outer query.
3. If plan quality remains poor, split the query into two separately executed statements and combine results in application code.
4. Consider materializing branch results in temporary/intermediate structures only when measurement confirms benefit.

## Validation note

Treat `UNION ALL` performance behavior as a migration review item even when functional test results match Oracle.


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
