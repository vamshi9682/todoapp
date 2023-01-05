/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
//const csrf = require("tiny-csrf")
const db = require("../models/index");
const app = require("../app");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

let login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Sign up ", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign Out ", async () => {
    let res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    res = await agent.get("/signout").send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@test.com", "12345678");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const res1 = await agent.post("/todos").send({
      title: "speaking skills",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(res1.statusCode).toBe(302);
  });
  test("Update a todo with given ID as complete / incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });
  });
  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "speaking skills",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const parsedResponse1 = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse1 = JSON.parse(parsedResponse1.text);
    const dueTodayCount = parsedGroupedResponse1.dueToday.length;
    const latestTodo = parsedGroupedResponse1.dueToday[dueTodayCount - 1];
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    const deleteResponse1 = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });
    const DeleteResponse1 = JSON.parse(deleteResponse1.text);
    expect(DeleteResponse1).toBe(true);
  });
});
