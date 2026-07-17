---
name: oracle-parentheses-from-clause
description: 
source: https://github.com/github/awesome-copilot/blob/main/skills/reviewing-oracle-to-postgres-migration/references/oracle-parentheses-from-clause.md
license: MIT
domain: developer
---

# oracle-parentheses-from-clause

# Oracle to PostgreSQL: Parentheses in FROM Clause

## Contents

- Problem
- Root Cause
- Solution Pattern
- Examples
- Migration Checklist
- Common Locations
- Application Code Examples
- Error Messages to Watch For
- Testing Recommendations

## Problem

Oracle allows optional parentheses around table names in the FROM clause:

```sql
-- Oracle: Both are valid
SELECT * FROM (TABLE_NAME) WHERE id = 1;
SELECT * FROM TABLE_NAME WHERE id = 1;
```

PostgreSQL does **not** allow extra parentheses around a single table name in the FROM clause without it being a derived table or subquery. Attempting to use this pattern results in:

```
Npgsql.PostgresException: 42601: syntax error at or near ")"
```

## Root Cause

- **Oracle**: Treats `FROM(TABLE_NAME)` as equivalent to `FROM TABLE_NAME`
- **PostgreSQL**: Parentheses in the FROM clause are only valid for:
  - Subqueries: `FROM (SELECT * FROM table)`
  - Explicit table references that are part of join syntax
  - Common Table Expressions (CTEs)
  - Without a valid SELECT or join context, PostgreSQL raises a syntax error

## Solution Pattern

Remove the unnecessary parentheses around the table name:

```sql
-- Oracle (problematic in PostgreSQL)
SELECT col1, col2
FROM (TABLE_NAME)
WHERE id = 1;

-- PostgreSQL (correct)
SELECT col1, col2
FROM TABLE_NAME
WHERE id = 1;
```

## Examples

### Example 1: Simple Table Reference

```sql
-- Oracle
SELECT employee_id, employee_name
FROM (EMPLOYEES)
WHERE department_id = 10;

-- PostgreSQL (fixed)
SELECT employee_id, employee_name
FROM EMPLOYEES
WHERE department_id = 10;
```

### Example 2: Join with Parentheses

```sql
-- Oracle (problematic)
SELECT e.employee_id, d.department_name
FROM (EMPLOYEES) e
JOIN (DEPARTMENTS) d ON e.department_id = d.department_id;

-- PostgreSQL (fixed)
SELECT e.employee_id, d.department_name
FROM EMPLOYEES e
JOIN DEPARTMENTS d ON e.department_id = d.department_id;
```

### Example 3: Valid Subquery Parentheses (Works in Both)

```sql
-- Both Oracle and PostgreSQL
SELECT *
FROM (SELECT employee_id, employee_name FROM EMPLOYEES WHERE department_id = 10) sub;
```

## Migration Checklist

When fixing this issue, verify:

1. **Identify all problematic FROM clauses**:
   - Search for `FROM (` pattern in SQL
   - Verify the opening parenthesis is immediately after `FROM` followed by a table name
   - Confirm it's **not** a subquery (no SELECT keyword inside)

2. **Distinguish valid parentheses**:
   - ✅ `FROM (SELECT ...)` - Valid subquery
   - ✅ `FROM (table_name` followed by a join - Check if JOIN keyword follows
   - ❌ `FROM (TABLE_NAME)` - Invalid, remove parentheses

3. **Apply the fix**:
   - Remove the parentheses around the table name
   - Keep parentheses for legitimate subqueries

4. **Test thoroughly**:
   - Execute the query in PostgreSQL
   - Verify result set matches original Oracle query
   - Include in integration tests

## Common Locations

Search for `FROM (` in:

- ✅ Stored procedures and functions (DDL scripts)
- ✅ Application data access layers (DAL classes)
- ✅ Dynamic SQL builders
- ✅ Reporting queries
- ✅ Views and materialized views
- ✅ Complex queries with multiple joins

## Application Code Examples

### VB.NET

```vb
' Before (Oracle)
StrSQL = "SELECT employee_id, NAME " _
       & "FROM (EMPLOYEES) e " _
       & "WHERE e.department_id = 10"

' After (PostgreSQL)
StrSQL = "SELECT employee_id, NAME " _
       & "FROM EMPLOYEES e " _
       & "WHERE e.department_id = 10"
```

### C #

```csharp
// Before (Oracle)
var sql = "SELECT id, name FROM (USERS) WHERE status = @status";

// After (PostgreSQL)
var sql = "SELECT id, name FROM USERS WHERE status = @status";
```

## Error Messages to Watch For

```
Npgsql.PostgresException: 42601: syntax error at or near ")"
ERROR: syntax error at or near ")"
LINE 1: SELECT * FROM (TABLE_NAME) WHERE ...
                      ^
```

## Testing Recommendations

1. **Syntax Verification**: Parse all migrated queries to ensure they run without syntax errors

   ```csharp
   [Fact]
   public void GetEmployees_ExecutesWithoutSyntaxError()
   {
       // Should not throw PostgresException with error code 42601
       var employees = dal.GetEmployees(departmentId: 10);
       Assert.NotEmpty(employees);
   }
   ```

2. **Result Comparison**: Verify that result sets are identical before and after migration
3. **Regex-based Search**: Use pattern `FROM\s*\(\s*[A-Za-z_][A-Za-z0-9_]*\s*\)` to identify candidates

## Related Files

- Reference: [oracle-to-postgres-type-coercion.md](oracle-to-postgres-type-coercion.md) - Other syntax differences
- PostgreSQL Documentation: [SELECT Statement](https://www.postgresql.org/docs/current/sql-select.html)

## Migration Notes

- This is a straightforward syntactic fix with no semantic implications
- No data conversion required
- Safe to apply automated find-and-replace, but manually verify complex queries
- Update integration tests to exercise the migrated queries


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
