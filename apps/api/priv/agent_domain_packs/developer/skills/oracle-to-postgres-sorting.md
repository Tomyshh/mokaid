---
name: oracle-to-postgres-sorting
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/reviewing-oracle-to-postgres-migration/references/oracle-to-postgres-sorting.md
license: MIT
domain: developer
---

# oracle-to-postgres-sorting

# Oracle to PostgreSQL Sorting Migration Guide

Purpose: Preserve Oracle-like sorting semantics when moving queries to PostgreSQL.

## Key points
- Oracle and PostgreSQL default collations can differ significantly.
- Use `COLLATE "C"` only when you explicitly need Oracle-like binary ordering and no different sort rule is requested.
- If Oracle uses explicit linguistic ordering (for example `NLS_SORT = French`), map to an explicit PostgreSQL locale collation instead of forcing `"C"`.

## 1) Standard `SELECT … ORDER BY`
**Goal:** Keep Oracle-style ordering.

**Pattern (only when Oracle-compatible binary ordering is required):**
```sql
SELECT col1
FROM your_table
ORDER BY col1 COLLATE "C";
```

**Notes:**
- Apply `COLLATE "C"` only to sort expressions that must mimic Oracle binary ordering.
- Works with ascending/descending and multi-column sorts, e.g. `ORDER BY col1 COLLATE "C", col2 COLLATE "C" DESC`.

## 1b) Locale-aware ordering (when Oracle used NLS_SORT)

If Oracle used locale-specific sorting such as:
```sql
ORDER BY nlssort(Externalusers.UserID, 'NLS_SORT = French')
```
map to an explicit PostgreSQL collation, for example:
```sql
ORDER BY Externalusers.UserID COLLATE "ca_FR.utf-8"
```

Use a collation that exists in the target environment. Discover available collations with:
```sql
SELECT collname, collprovider, collcollate, collctype
FROM pg_collation
ORDER BY collname;
```

## 2) `SELECT DISTINCT … ORDER BY`
**Issue:** PostgreSQL enforces that `ORDER BY` expressions appear in the `SELECT` list for `DISTINCT`, raising:
`Npgsql.PostgresException: 42P10: for SELECT DISTINCT, ORDER BY expressions must appear in select list`

**Oracle difference:** Oracle allowed ordering by expressions not projected when using `DISTINCT`.

**Recommended pattern (wrap and sort):**
```sql
SELECT *
FROM (
  SELECT DISTINCT col1, col2
  FROM your_table
) AS distinct_results
ORDER BY col2 COLLATE "C";
```

**Why:**
- The inner query performs the `DISTINCT` projection.
- The outer query safely orders the result set and adds an explicit collation where needed to align with Oracle sorting.

**Tips:**
- Ensure any columns used in the outer `ORDER BY` are included in the inner projection.
- For multi-column sorts, collate each relevant expression: `ORDER BY col2 COLLATE "C", col3 COLLATE "C" DESC`.

## Validation checklist
- [ ] Applied explicit collation only where required (`"C"` for Oracle-style binary ordering, locale collation for linguistic ordering).
- [ ] For `DISTINCT` queries, wrapped the projection and sorted in the outer query.
- [ ] Confirmed ordered columns are present in the inner projection.
- [ ] Re-ran tests or representative queries to verify ordering matches Oracle outputs.


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
