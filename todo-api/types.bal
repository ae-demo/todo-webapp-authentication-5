// Wire types, from specs/design/components/todo-api/openapi.yaml, and the
// database row shape they are built from.
import ballerina/http;
import ballerina/time;

public type TodoItem record {|
    string id;
    string title;
    boolean completed;
    string createdAt;
    string updatedAt;
|};

public type CreateTodoItem record {|
    string title;
|};

public type UpdateTodoItem record {|
    string title?;
    boolean completed?;
|};

public type TodoPage record {|
    int count;
    string? next = ();
    string? previous = ();
    TodoItem[] data;
|};

public type Error record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type ErrorUnauthorized record {|
    *http:Unauthorized;
    Error body;
|};

// One row of the `todo_item` table, as `db.bal`'s queries alias every column
// to. Closed, so a query that stops selecting a column fails to compile
// rather than silently dropping a field.
public type TodoRow record {|
    string id;
    string title;
    boolean completed;
    string userId;
    time:Utc createdAt;
    time:Utc updatedAt;
|};
