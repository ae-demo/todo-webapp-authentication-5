import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type TodoItem = components["schemas"]["TodoItem"];

// State lives in the PAGE (module scope), not a server: a create shows up in
// the next list, a delete removes it, an edit persists — but only across
// in-app navigation. A full page load (reload, typed URL) re-runs this module
// and puts the seed data back. That reset is what makes a verification run
// repeatable, and also why a row created mid-scenario can vanish on reload.
//
// Every operation in todo-api's openapi.yaml is under /me/ — there is no
// every-row endpoint — so every row here belongs to whoever is signed in;
// mock/authz/gateway.ts has already refused a caller with no `todos:*` scope
// before any handler below is reached.
//
// Seed rows match wireframes.dsl's TodoList table exactly (the reviewer's
// walk compares the running page against that picture): "Buy groceries" and
// "Finish report". One is marked completed so the completed/incomplete
// visual distinction the Acceptance criteria requires is visible on load.
function nowIso(): string {
  return new Date().toISOString();
}

let nextId = 3;
let todos: TodoItem[] = [
  {
    id: "1",
    title: "Buy groceries",
    completed: false,
    createdAt: "2026-09-17T09:00:00.000Z",
    updatedAt: "2026-09-17T09:00:00.000Z",
  },
  {
    id: "2",
    title: "Finish report",
    completed: true,
    createdAt: "2026-09-16T09:00:00.000Z",
    updatedAt: "2026-09-17T10:30:00.000Z",
  },
];

function errorBody(code: number, message: string) {
  return { code, message };
}

export const handlers = [
  http.get("/api/me/todos", () => {
    return HttpResponse.json({ count: todos.length, next: null, previous: null, data: todos });
  }),

  http.post("/api/me/todos", async ({ request }) => {
    const input = (await request.json()) as { title?: unknown };
    if (typeof input?.title !== "string" || input.title.trim().length === 0) {
      return HttpResponse.json(errorBody(400, "title is required"), { status: 400 });
    }
    const created: TodoItem = {
      id: String(nextId++),
      title: input.title,
      completed: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    todos = [...todos, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("/api/me/todos/:todoId", ({ params }) => {
    const todo = todos.find((t) => t.id === params.todoId);
    if (!todo) return HttpResponse.json(errorBody(404, "no such todo"), { status: 404 });
    return HttpResponse.json(todo);
  }),

  http.patch("/api/me/todos/:todoId", async ({ params, request }) => {
    const index = todos.findIndex((t) => t.id === params.todoId);
    if (index === -1) return HttpResponse.json(errorBody(404, "no such todo"), { status: 404 });
    const input = (await request.json()) as { title?: unknown; completed?: unknown };
    if (input.title !== undefined && typeof input.title !== "string") {
      return HttpResponse.json(errorBody(400, "title must be a string"), { status: 400 });
    }
    if (input.completed !== undefined && typeof input.completed !== "boolean") {
      return HttpResponse.json(errorBody(400, "completed must be a boolean"), { status: 400 });
    }
    const updated: TodoItem = {
      ...todos[index],
      ...(typeof input.title === "string" ? { title: input.title } : {}),
      ...(typeof input.completed === "boolean" ? { completed: input.completed } : {}),
      updatedAt: nowIso(),
    };
    todos = [...todos.slice(0, index), updated, ...todos.slice(index + 1)];
    return HttpResponse.json(updated);
  }),

  http.delete("/api/me/todos/:todoId", ({ params }) => {
    const before = todos.length;
    todos = todos.filter((t) => t.id !== params.todoId);
    return before === todos.length
      ? HttpResponse.json(errorBody(404, "no such todo"), { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),
];
