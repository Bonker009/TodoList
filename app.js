import express from "express";
import bodyParser from "body-parser";
import _ from "lodash";
import mongoose from "mongoose";

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(
  "mongodb+srv://Seyha:1wCaw5yVshPHBmvJ@cluster0.blnenem.mongodb.net/?retryWrites=true&w=majority"
);
const itemSchema = new mongoose.Schema({
  name: String,
});
const listShema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listShema);

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];
const item1 = new Item({
  name: "Welcome to your todolist",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<--- hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];
app.get("/", async function (req, res) {
  const foundItems = await Item.find();
  console.log(foundItems);
  try {
    if (foundItems == 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to database!");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error("Sucessfully failed :", err);
  }
});
app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const existingList = await List.findOne({ name: customListName });
    if (existingList) {
      res.render("list", {
        listTitle: existingList.name,
        newListItems: existingList.items,
      });
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();

      res.redirect(`/${customListName}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName,
  });
  if (listName == "Today") {
    try {
      await newItem.save();
      res.redirect("/");
    } catch (error) {
      console.error("Error occurred: ", error);
      res.status(500).send("An error occurred while saving the item.");
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(newItem);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("List not found.");
        res.status(404).send("List not found.");
      }
    } catch (error) {
      console.error("Error occurred: ", error);
      res.status(500).send("An error occurred.");
    }
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted item!!");
    } catch (err) {
      console.error("Item not found in database : ", err);
    }
    res.redirect("/");
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
    } catch (err) {
      console.error("Fail");
    }
    res.redirect("/" + listName);
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
