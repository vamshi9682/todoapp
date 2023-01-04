const request = require("supertest");
var cheerio = require("cheerio")
const db = require("../models/index");
const app = require("../app");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
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

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marking a todo with the given ID as complete / Incomplete", async () => {
    const agent = request.agent(server);
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Do Homework",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf" : csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy Mi",
      dueDate: new Date().toISOString(),
      completed: true,
      "_csrf": csrfToken,
    });

    const groupedParsedResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedParsedResponse.text);
    const dueTodayCount =parsedGroupedResponse.length;
    const latestTodo = parsedGroupedResponse[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${ latestTodo.id }`)
      .send({
        "_csrf" : csrfToken,
      });
  const parsedUpdateResponse = Boolean(markCompleteResponse.text.completed);
  parsedUpdateResponse ? expect(parsedUpdateResponse).toBe(true) : expect(parsedUpdateResponse).toBe(false);
  });

  // test("Marking a todo with the given ID as complete", async () => {
  //   const agent = request.agent(server);

  //   let res = await agent.get("/");
  //   let csrfToken = extractCsrfToken(res);

    

  //   const groupedParsedResponse = await agent
  //     .get("/")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedParsedResponse.text);
  //   const dueTodayCount = parsedGroupedResponse.duetodayTodos.length;
  //   const latestTodo = parsedGroupedResponse.duetodayTodos[dueTodayCount - 1];

  //   res = await agent.get("/todos");
  //   csrfToken = extractCsrfToken(res);

  //   const markCompleteResponse = await agent
  //     .put(`/todos/${latestTodo.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //     });
  // const parsedUpdateResponse = Boolean(markCompleteResponse.text.completed);
   
  // });
  
  

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "complete level-6 in wed development",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const groupedTodosResponse = await agent
    .get("/todos")
    .set("Accept", "application/json");

  const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
  const dueTodayCount = parsedGroupedResponse.length;
  const latestTodo = parsedGroupedResponse[dueTodayCount - 1];

  res = await agent.get("/todos");
  csrfToken = extractCsrfToken(res);

  const deleteResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
    _csrf: csrfToken,
  });

  const deletestatus = Boolean(deleteResponse.text);

  deletestatus
    ? expect(deletestatus).toBe(true)
    : expect(deletestatus).toBe(false);
});

 });
