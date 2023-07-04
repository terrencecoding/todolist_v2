//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connect.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// mongoose (Schema)
const itemsSchema = {
  name: String,
};
// mongooes (model)
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your TO do list",
});
const item2 = new Item({
  name: "Hit the + to your ToDoList",
});
const item3 = new Item({
  name: "<-- hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //printing all store values in terminal (In my case Hyper Terminal)
  Item.find({})
    .then((foundItem) => {
      if (foundItem.length === 0) {
        console.log("Succesfully saved default items to DB.");
        return Item.insertMany(defaultItems);
      } else {
        return foundItem;
      }
    })
    .then((savedItem) => {
      res.render("list", {
        listTitle: "Today",
        newListItems: savedItem,
      });
    })
    .catch((err) => console.log(err));
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

// error MongooseError: Model.find() no longer accepts a callback error
//   Item.find()
//     .then(function (foundItem) {
//       if (foundItem === 0) {
//         // inserting all item into todolistDB using mongoose
//         Item.insertMany([item1, item2, item3])
//           .then(function (items) {
//             console.log("SuccessFully save all the items to todolistDB");
//           })
//           .catch(function (err) {
//             console.log(err);
//           });
//           res.redirect("/");
//       } else {
//         res.render("list", {
//           listTitle: "Today",
//           newListItems: foundItem,
//         });
//       }

//     })
//     .catch(function (err) {
//       console.log(err);
//     });
// });

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   foundItem.push(item); //foundItem not defined
  //   res.redirect("/");
  // }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Successfully removed item on the list.");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName }, //filter what you're looking for
      { $pull: { items: { _id: checkedItemId } } } //condition what do you want to update
    )
      .then(function (foundList) {
        //List found, now redirect to that list after remove and update
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

// Delete and create a dynamic route
// app.get("/work", function (req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems,
//   });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }

connectDB().then(() => {
  app.listen(PORT, function () {
    console.log("Server has started successfully.");
  });
});
