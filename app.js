// Imported Modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// DB Connect 
mongoose.connect(process.env.SERVER_LINK);

// Schemas
const itemsShcema = {
  name: String,
  checked: Boolean
};

const listSchema = {
  name: String, 
  items: [itemsShcema]
};

// Models
const Item = mongoose.model (
  "item",
  itemsShcema
);

const List = mongoose.model(
  "List", listSchema
);


// Initial list items 
const item1 = new Item ({
  name: "Welcome to you todo list!",
  checked: false
})
const item2 = new Item ({
  name: "Hit + to add a new item.",
  checked: false
})
const item3 = new Item ({
  name: "<-- Hit this checkbox to delete >",
  checked: false
})

const defaultItems = [item1, item2, item3]

// *** APP.GET
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(err){
      console.log(err);
    } else {
      if (foundItems.length === 0){
        // Insert default items
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          } else {
            console.log("Items saved.");
          }
        })
        res.redirect("/")
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    }
  })
});

app.get("/:listName", function(req,res){
  const listName = _.capitalize(req.params.listName)
  
  List.findOne({name: listName}, function(err, listFound){
    if(err){
      console.log(err);
    } else {
      if (!listFound){
        const list = new List({
          name: listName,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + listName)
      } else {
        res.render("list", {listTitle: listFound.name, newListItems: listFound.items});
      }
    }
  })

});

app.get("/about", function(req, res){
  res.render("about");
});


// *** APP.POST
app.post("/", function(req, res){

  const itemName = req.body.newItem;  
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName,
    checked: false
  })

  if (listName === "Today"){
    newItem.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem)
      foundList.save()
      res.redirect("/" + listName)
    })
  }

  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if (listName === "Today"){
    Item.findByIdAndDelete(checkedItemId, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Data deleted"); 
      }
    });
  
    res.redirect("/")
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName)
      }
    })
  }
})


// SERVER PORT 
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started!");
});
