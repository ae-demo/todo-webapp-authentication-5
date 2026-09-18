// Persistence for the caller's todo items. Every function here takes the
// caller's own userId and filters on it — the gateway assertion's `sub`,
// never a client-supplied value — so a row that belongs to someone else is
// simply not in the result, which is what turns "not mine" into a 404
// upstream rather than a 403.
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function todoWhereClause(string userId, boolean? completed) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery clause = `user_id = ${userId}`;
    if completed is boolean {
        clause = sql:queryConcat(clause, ` AND completed = ${completed}`);
    }
    return clause;
}

function countTodos(string userId, boolean? completed) returns int|error {
    sql:ParameterizedQuery query = sql:queryConcat(
        `SELECT COUNT(*) FROM todo_item WHERE `, todoWhereClause(userId, completed));
    int total = check todoDb->queryRow(query);
    return total;
}

function listTodos(string userId, boolean? completed, int pageLimit, int pageOffset) returns TodoRow[]|error {
    sql:ParameterizedQuery query = sql:queryConcat(
        `SELECT id, title, completed, user_id AS "userId", created_at AS "createdAt",
            updated_at AS "updatedAt" FROM todo_item WHERE `,
        todoWhereClause(userId, completed),
        ` ORDER BY created_at DESC, id LIMIT ${pageLimit} OFFSET ${pageOffset}`);
    stream<TodoRow, sql:Error?> rows = todoDb->query(query);
    TodoRow[] items = check from TodoRow r in rows select r;
    return items;
}

function findTodo(string userId, string todoId) returns TodoRow?|error {
    sql:ParameterizedQuery query = `SELECT id, title, completed, user_id AS "userId",
        created_at AS "createdAt", updated_at AS "updatedAt" FROM todo_item
        WHERE id = ${todoId} AND user_id = ${userId}`;
    TodoRow|sql:Error result = todoDb->queryRow(query);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function insertTodo(string userId, string title) returns TodoRow|error {
    string id = uuid:createType4AsString();
    time:Utc now = time:utcNow();
    sql:ExecutionResult _ = check todoDb->execute(`
        INSERT INTO todo_item (id, user_id, title, completed, created_at, updated_at)
        VALUES (${id}, ${userId}, ${title}, false, ${now}, ${now})`);
    return {id, title, completed: false, userId, createdAt: now, updatedAt: now};
}

function updateTodo(string userId, string todoId, string? newTitle, boolean? newCompleted)
        returns TodoRow?|error {
    TodoRow? existing = check findTodo(userId, todoId);
    if existing is () {
        return ();
    }
    string title = newTitle ?: existing.title;
    boolean completed = newCompleted ?: existing.completed;
    time:Utc now = time:utcNow();
    sql:ExecutionResult _ = check todoDb->execute(`
        UPDATE todo_item SET title = ${title}, completed = ${completed}, updated_at = ${now}
        WHERE id = ${todoId} AND user_id = ${userId}`);
    return {id: existing.id, title, completed, userId, createdAt: existing.createdAt, updatedAt: now};
}

function deleteTodo(string userId, string todoId) returns boolean|error {
    sql:ExecutionResult result = check todoDb->execute(
        `DELETE FROM todo_item WHERE id = ${todoId} AND user_id = ${userId}`);
    int? affected = result.affectedRowCount;
    return affected is int && affected > 0;
}

function toTodoItem(TodoRow row) returns TodoItem => {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: time:utcToString(row.createdAt),
    updatedAt: time:utcToString(row.updatedAt)
};
