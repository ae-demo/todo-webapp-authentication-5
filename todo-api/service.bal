// Implements specs/design/components/todo-api/openapi.yaml exactly.
//
// The gateway has already enforced each operation's scope; this service
// holds no operation -> scope table. Every handler resolves the caller from
// the gateway's signed assertion (never a client-supplied header) and every
// `/me/todos` query is scoped to that caller's userId. A todo that exists
// but belongs to someone else is a 404, never a 403.
import ballerina/http;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {
    public function createInterceptors() returns AssertionInterceptor => new;

    # The caller's todo items
    #
    # + ctx - the request context the gateway-assertion interceptor wrote to
    # + completed - filter by completion status
    # + 'limit - page size, default 20, clamped to 100
    # + offset - page start, default 0
    # + return - a page of the caller's todo items, or 401 when not signed in
    resource function get me/todos(http:RequestContext ctx, boolean? completed,
            int 'limit = 20, int offset = 0) returns TodoPage|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized callerResult = requireGatewayCaller(ctx);
        if callerResult is http:Unauthorized {
            return unauthorizedError();
        }
        GatewayCaller caller = callerResult;

        int pageLimit = 'limit;
        if pageLimit < 1 {
            pageLimit = 20;
        }
        if pageLimit > 100 {
            pageLimit = 100;
        }
        int pageOffset = offset < 0 ? 0 : offset;

        int total = check countTodos(caller.userId, completed);
        TodoRow[] rows = check listTodos(caller.userId, completed, pageLimit, pageOffset);
        TodoItem[] items = from TodoRow r in rows select toTodoItem(r);

        string? next = ();
        if pageOffset + pageLimit < total {
            next = pageUri(pageLimit, pageOffset + pageLimit, completed);
        }
        string? previous = ();
        if pageOffset > 0 {
            int prevOffset = pageOffset - pageLimit;
            previous = pageUri(pageLimit, prevOffset < 0 ? 0 : prevOffset, completed);
        }

        return {count: total, next, previous, data: items};
    }

    # Create a new todo item for the caller
    #
    # + ctx - the request context the gateway-assertion interceptor wrote to
    # + payload - the new item's title
    # + return - the created item, 400 for an empty title, or 401 when not signed in
    resource function post me/todos(http:RequestContext ctx, @http:Payload CreateTodoItem payload)
            returns http:Created|ErrorBadRequest|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized callerResult = requireGatewayCaller(ctx);
        if callerResult is http:Unauthorized {
            return unauthorizedError();
        }
        GatewayCaller caller = callerResult;

        string title = payload.title.trim();
        if title == "" {
            return badRequestError("title must not be empty");
        }

        TodoRow created = check insertTodo(caller.userId, title);
        return <http:Created>{body: toTodoItem(created)};
    }

    # A single todo item of the caller's
    #
    # + ctx - the request context the gateway-assertion interceptor wrote to
    # + todoId - the item's id
    # + return - the item, 404 when it does not exist for this caller, or 401 when not signed in
    resource function get me/todos/[string todoId](http:RequestContext ctx)
            returns TodoItem|ErrorNotFound|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized callerResult = requireGatewayCaller(ctx);
        if callerResult is http:Unauthorized {
            return unauthorizedError();
        }
        GatewayCaller caller = callerResult;

        TodoRow? row = check findTodo(caller.userId, todoId);
        if row is () {
            return notFoundError();
        }
        return toTodoItem(row);
    }

    # Edit a todo item's title or completion status
    #
    # + ctx - the request context the gateway-assertion interceptor wrote to
    # + todoId - the item's id
    # + payload - the fields to change
    # + return - the updated item, 400 for an empty title, 404 when it does not
    #   exist for this caller, or 401 when not signed in
    resource function patch me/todos/[string todoId](http:RequestContext ctx,
            @http:Payload UpdateTodoItem payload)
            returns TodoItem|ErrorBadRequest|ErrorNotFound|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized callerResult = requireGatewayCaller(ctx);
        if callerResult is http:Unauthorized {
            return unauthorizedError();
        }
        GatewayCaller caller = callerResult;

        string? newTitle = payload?.title;
        if newTitle is string && newTitle.trim() == "" {
            return badRequestError("title must not be empty");
        }

        TodoRow? updated = check updateTodo(caller.userId, todoId, newTitle, payload?.completed);
        if updated is () {
            return notFoundError();
        }
        return toTodoItem(updated);
    }

    # Delete a todo item of the caller's
    #
    # + ctx - the request context the gateway-assertion interceptor wrote to
    # + todoId - the item's id
    # + return -204 once deleted, 404 when it does not exist for this caller, or 401 when not signed in
    resource function delete me/todos/[string todoId](http:RequestContext ctx)
            returns http:NoContent|ErrorNotFound|ErrorUnauthorized|error {
        GatewayCaller|http:Unauthorized callerResult = requireGatewayCaller(ctx);
        if callerResult is http:Unauthorized {
            return unauthorizedError();
        }
        GatewayCaller caller = callerResult;

        boolean deleted = check deleteTodo(caller.userId, todoId);
        if !deleted {
            return notFoundError();
        }
        return http:NO_CONTENT;
    }
}

function pageUri(int pageLimit, int pageOffset, boolean? completed) returns string {
    string uri = "/me/todos?limit=" + pageLimit.toString() + "&offset=" + pageOffset.toString();
    if completed is boolean {
        uri = uri + "&completed=" + completed.toString();
    }
    return uri;
}

function unauthorizedError() returns ErrorUnauthorized => {body: {code: 401, message: "not signed in"}};

function notFoundError() returns ErrorNotFound =>
    {body: {code: 404, message: "no such todo item for this caller"}};

function badRequestError(string message) returns ErrorBadRequest => {body: {code: 400, message: message}};
