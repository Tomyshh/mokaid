---
name: empty-strings-handling
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/reviewing-oracle-to-postgres-migration/references/empty-strings-handling.md
license: MIT
domain: developer
---

# empty-strings-handling

# Oracle to PostgreSQL: Empty String Handling Differences

## Problem

Oracle automatically converts empty strings (`''`) to `NULL` in VARCHAR2 columns. PostgreSQL preserves empty strings as distinct from `NULL`. This difference can cause application logic errors and test failures during migration.

## Behavior Comparison

**Oracle:**
- Empty string (`''`) is **always** treated as `NULL` in VARCHAR2 columns
- `WHERE column = ''` never matches rows; use `WHERE column IS NULL`
- Cannot distinguish between explicit empty string and `NULL`

**PostgreSQL:**
- Empty string (`''`) and `NULL` are **distinct** values
- `WHERE column = ''` matches empty strings
- `WHERE column IS NULL` matches `NULL` values

## Code Example

```sql
-- Oracle behavior
INSERT INTO table (varchar_column) VALUES ('');
SELECT * FROM table WHERE varchar_column IS NULL;  -- Returns the row

-- PostgreSQL behavior  
INSERT INTO table (varchar_column) VALUES ('');
SELECT * FROM table WHERE varchar_column IS NULL;  -- Returns nothing
SELECT * FROM table WHERE varchar_column = '';     -- Returns the row
```

## Migration Actions

### 1. Stored Procedures
Update logic that assumes empty strings convert to `NULL`:

```sql
-- Preserve Oracle behavior (convert empty to NULL):
column = NULLIF(param, '')

-- Or accept PostgreSQL behavior (preserve empty string):
column = param
```

### 2. Application Code
Review code that checks for `NULL` and ensure it handles empty strings appropriately:

```csharp
// Before (Oracle-specific)
if (value == null) { }

// After (PostgreSQL-compatible)
if (string.IsNullOrEmpty(value)) { }
```

### 3. Tests
Update assertions to be compatible with both behaviors:

```csharp
// Migration-compatible test pattern
var value = reader.IsDBNull(columnIndex) ? null : reader.GetString(columnIndex);
Assert.IsTrue(string.IsNullOrEmpty(value));
```

### 4. Data Migration
Decide whether to:
- Convert existing `NULL` values to empty strings
- Convert empty strings to `NULL` using `NULLIF(column, '')`
- Leave values as-is and update application logic


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
