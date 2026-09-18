import { useCallback, useEffect, useState, type JSX } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  ListingTable,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Check, Pencil, Plus, Trash2, X } from "@wso2/oxygen-ui-icons-react";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type TodoItem = components["schemas"]["TodoItem"];

/**
 * The app's one screen (wireframes.dsl: screen TodoList). Holds no data of
 * its own — every mutation round-trips through todo-api and the list is
 * refetched/reconciled afterward (component contract's Acceptance criteria).
 */
export function TodoListPage(): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: apiError } = await todoApi.GET("/me/todos", {});
    if (apiError) {
      setError("Could not load your todos.");
      return;
    }
    setTodos(data?.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(): Promise<void> {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    try {
      const { error: apiError } = await todoApi.POST("/me/todos", {
        body: { title },
      });
      if (apiError) {
        setError("Could not add that todo.");
        return;
      }
      setNewTitle("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(todo: TodoItem): Promise<void> {
    setBusyId(todo.id);
    setError(null);
    try {
      const { error: apiError } = await todoApi.PATCH("/me/todos/{todoId}", {
        params: { path: { todoId: todo.id } },
        body: { completed: !todo.completed },
      });
      if (apiError) {
        setError("Could not update that todo.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(todo: TodoItem): void {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditTitle("");
  }

  async function saveEdit(todoId: string): Promise<void> {
    const title = editTitle.trim();
    if (!title) return;
    setBusyId(todoId);
    setError(null);
    try {
      const { error: apiError } = await todoApi.PATCH("/me/todos/{todoId}", {
        params: { path: { todoId } },
        body: { title },
      });
      if (apiError) {
        setError("Could not save that title.");
        return;
      }
      setEditingId(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(todoId: string): Promise<void> {
    setBusyId(todoId);
    setError(null);
    try {
      const { error: apiError } = await todoApi.DELETE("/me/todos/{todoId}", {
        params: { path: { todoId } },
      });
      if (apiError) {
        setError("Could not delete that todo.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Todo</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="What needs doing?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAdd();
          }}
          fullWidth
          disabled={adding}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => void handleAdd()}
          disabled={adding || newTitle.trim().length === 0}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Stack>

      {error ? (
        <Typography color="error.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Done</ListingTable.Cell>
              <ListingTable.Cell>Title</ListingTable.Cell>
              <ListingTable.Cell>&nbsp;</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {todos === null ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : todos.length === 0 ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No todos yet"
                    description="Add your first todo above."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              todos.map((todo) => (
                <ListingTable.Row key={todo.id}>
                  <ListingTable.Cell>
                    <Checkbox
                      checked={todo.completed}
                      disabled={busyId === todo.id}
                      onChange={() => void handleToggle(todo)}
                      inputProps={{ "aria-label": `Mark "${todo.title}" ${todo.completed ? "incomplete" : "complete"}` }}
                    />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    {editingId === todo.id ? (
                      <TextField
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveEdit(todo.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        size="small"
                        fullWidth
                        autoFocus
                      />
                    ) : (
                      <Typography
                        component="span"
                        sx={
                          todo.completed
                            ? { textDecoration: "line-through", color: "text.secondary" }
                            : undefined
                        }
                      >
                        {todo.title}
                      </Typography>
                    )}
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    <ListingTable.RowActions>
                      {editingId === todo.id ? (
                        <>
                          <IconButton
                            size="small"
                            aria-label="Save"
                            disabled={busyId === todo.id}
                            onClick={() => void saveEdit(todo.id)}
                          >
                            <Check size={16} />
                          </IconButton>
                          <IconButton size="small" aria-label="Cancel" onClick={cancelEdit}>
                            <X size={16} />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            aria-label="Edit"
                            disabled={busyId === todo.id}
                            onClick={() => startEdit(todo)}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="Delete"
                            disabled={busyId === todo.id}
                            onClick={() => void handleDelete(todo.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </>
                      )}
                    </ListingTable.RowActions>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Toggle the checkbox to mark a todo complete or incomplete.
      </Typography>
    </PageContent>
  );
}
