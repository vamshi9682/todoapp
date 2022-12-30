"use strict";
const { Model , Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }

    static getTodos() {
      return this.findAll();
    }
    
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      console.log(
        (await Todo.overdue())
          .map((x) => {
            x.displayableString();
          })
          .join("\n")
      );

      console.log("\n");

      console.log("Due Today");
      console.log(
        (await Todo.dueToday())
          .map((x) => {
            x.displayableString();
          })
          .join("\n")
      );

      console.log("\n");

      console.log("Due Later");
      console.log(
        (await Todo.dueLater())
          .map((x) => {
            x.displayableString();
          })
          .join("\n")
      );
    }

    static async overdue() {
      return await Todo.findAll({
        where: {
          dueDate: { [Op.lt]: new Date().toLocaleDateString("en-CA") },
          completed: false,
        },
        order: [["id","ASC"]],
      });
    }
    
    static async duetoday() {
      return await Todo.findAll({
        where: {
          dueDate: { [Op.eq]: new Date().toLocaleDateString("en-CA") },
          completed: false,
        },
        order: [["id","ASC"]],
      });
    }

    static async duelater() {
      return await Todo.findAll({
        where: {
          dueDate: { [Op.gt]: new Date().toLocaleDateString("en-CA") },
          completed: false,
        },
        order: [["id","ASC"]],
      });
    }

    static markAsCompleted() {
      return this.update({ completed: true });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
