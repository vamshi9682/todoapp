const express = require("express");
var csrf  = require("tiny-csrf");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.set("view engine","ejs");
const path = require("path");
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST", "PUT", "DELETE"]));
app.get("/", async (request, response)  => {
  const overduetodos = await Todo.overdue();
  const duetodayTodos = await Todo.duetoday();
  const duelaterTodos = await Todo.duelater();
  const completed = await Todo.completed();
  if (request.accepts("html")) {
    response.render("index", {
      overduetodos,
      duetodayTodos,
      duelaterTodos,
      completed,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overduetodos,
      duetodayTodos,
      duelaterTodos,
      completed,
      csrfToken: request.csrfToken(),
    });
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll({ order : [[ "id" , "ASC" ]]})
    return response.json(todos);
  } 
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


app.delete("/todos/:id", async (request, response) => {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try{
    await Todo.remove(request.params.id);
    return response.json({success: true});
  } catch (error) {
    return response.status(422).json(error);
  }

  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
