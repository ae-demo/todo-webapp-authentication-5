// All external configuration, read once from platform-injected environment
// variables. Nothing else in this package calls `os:getEnv`.
//
// The service starts with none of these set: `db.bal` falls back to a
// sensible local default for each one that arrives empty, so a missing env
// var never stops the process from starting — only from reaching a real
// database.
import ballerina/os;

configurable string todoDbHost = os:getEnv("TODO_DB_HOST");
configurable string todoDbPort = os:getEnv("TODO_DB_PORT");
configurable string todoDbName = os:getEnv("TODO_DB_DBNAME");
configurable string todoDbUser = os:getEnv("TODO_DB_USER");
configurable string todoDbPassword = os:getEnv("TODO_DB_PASSWORD");
