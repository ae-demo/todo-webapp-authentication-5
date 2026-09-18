screen TodoList "The signed-in user's own todo items"
  navbar "Todo"
  row
    input "What needs doing?"
    right
    button "Add" primary // adds the todo to the list below, stays on this page
  table "Done | Title | "
    row "checkbox | Buy groceries | edit/delete"
    row "checkbox | Finish report | edit/delete"
  text "Toggle the checkbox to mark a todo complete or incomplete."

flow "Manage my todos"
  role "User"
  description "A signed-in user adds, views, completes and removes their own todo items"
  TodoList
