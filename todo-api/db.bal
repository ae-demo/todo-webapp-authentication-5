// The Postgres connection and the table this service owns.
//
// `todo-db` (postgres-cnpg) is a platform-resource dependency; its wiring is
// injected as the TODO_DB_* env vars read in config.bal. A missing one falls
// back to a local default here, never in the configurable declaration
// itself, so the service always starts.
import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client todoDb = check initTodoDbClient();
final () todoDbSchemaReady = check initTodoDbSchema();

function initTodoDbClient() returns postgresql:Client|error {
    string host = todoDbHost == "" ? "localhost" : todoDbHost;
    string user = todoDbUser == "" ? "postgres" : todoDbUser;
    string password = todoDbPassword == "" ? "postgres" : todoDbPassword;
    string database = todoDbName == "" ? "todoapi" : todoDbName;
    int port = 5432;
    if todoDbPort != "" {
        port = check int:fromString(todoDbPort);
    }
    return new (host = host, username = user, password = password, database = database, port = port);
}

function initTodoDbSchema() returns error? {
    sql:ExecutionResult _ = check todoDb->execute(`
        CREATE TABLE IF NOT EXISTS todo_item (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(500) NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )`);
    sql:ExecutionResult _ = check todoDb->execute(`
        CREATE INDEX IF NOT EXISTS idx_todo_item_user_id ON todo_item (user_id)`);
    return;
}
