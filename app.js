//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _=require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static("public"));
const path = require('path');
app.use(express.static(path.join(__dirname, "public")));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-ser:ser123@cluster0.ba01uaw.mongodb.net/todolistDB?retryWrites=true&w=majority');

  //await mongoose.connect('mongodb+srv://<username>:<password>@cluster0.ba01uaw.mongodb.net/<databasename>');
  //await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

// const itemsSchema=new mongoose.Schema({name:String};) şeklinde de olabilirdi.
const itemsSchema={name:String};
const listSchema={name:String, items:[itemsSchema]};

const Item = mongoose.model("item",itemsSchema);
const List = mongoose.model("list",listSchema);

const notForget1= new Item({name:"Yapılacaklar Listenize Hoş Geldiniz."});
const notForget2= new Item({name:"Yeni madde için +'ya basınız."});
const notForget3= new Item({name:"<-- Kutuya tıklarsanız madde silinir."});

const defaultItems=[notForget1,notForget2,notForget3];
const day = date.getDate();

app.get("/", function(req, res) {

  Item.find().then((foundItems)=>{
    if (foundItems.length ===0) {
      Item.insertMany(defaultItems)
      .then(()=>{
        console.log("Default items added to list");
        res.redirect("/");})
      .catch((err)=>{
        console.log("An error occured while adding default items to the list/n"+err)});
    }
    else{
    res.render("list", {listTitle: "Main List", newListItems: foundItems, day:day})
    };
  }).catch((err)=>{
    console.log(err);
  });
});

app.post("/", function(req, res){
    const itemName=req.body.newItem;
    const listName=req.body.list;
    console.log("Temel Listemiz:"+listName);

    // modelden yeni bir item üretelim.
    const item = new Item({name:itemName});

    if (listName==="Main List") {

      // Ürettiğimiz item'i dabase'e ekleyelim.
      item.save();
      res.redirect("/");
    }
    else{
      List.findOne({name:listName}).then((foundList)=>{
        console.log("listemiz:"+listName);
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      }).catch((err)=>{console.log(err)});
    }
});

app.get("/:customListName",(req,res)=>{
  //console.log(req.params.customListName);
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({name:customListName}).then((foundList)=>{
  if (customListName!=="favicon.ico"||customListName!=="Favicon.ico") {
    if(!foundList)
    {
      console.log("doesn't exists")
      const list=new List({name:customListName, items:defaultItems, day:day});
      list.save();
      res.redirect("/"+customListName);
    }
    else
    {console.log("exists")
    res.render("list",{list:customListName,listTitle:foundList.name, newListItems:foundList.items})
    }
  }
  }).catch((err)=>console.log(err));
});

app.post("/delete",(req,res)=>{
const listName=req.body.listName;
const itemid=req.body.checkbox;
  if (listName!="Main List") {
    List.findOne({name:listName}).then((foundList)=>{
      console.log("Liste adı: "+foundList.name);
      foundList.items.pull({_id:itemid});
      foundList.save();
      res.redirect("/"+listName);
    }).catch((err)=>{
      console.log("hata!: "+err)
    });
  }
  else{
    console.log("Listeadı boş:"+ listName);
    Item.deleteOne({_id:req.body.checkbox}).then((deleted)=>{
      console.log("Silinen Kayıt Sayısı: "+deleted.deletedCount);
    }).catch(err=>console.log(err));
    res.redirect("/");
  }
});

app.get("/about", function(req, res){
  res.render("about");
});


app.listen(process.env.PORT);

let port=process.env.PORT;

if(port==null||port=="")
{
  port=3000;
  app.listen(port,function() {
    console.log("Server started on port 3000");
  });
} else{
  console.log("Now on port: "+port);
}
