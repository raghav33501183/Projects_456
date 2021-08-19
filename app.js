//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const path = require("path");
const _ = require("lodash");

const app = express();

app.use(express.static("public"));

if(typeof localStorage === "undefined" || localStorage === null){
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

const Storage = multer.diskStorage({
  destination:"./public/uploads/",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
  }
});

const upload = multer({
  storage:Storage
}).single('file');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/AnimalDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true});

const itemsSchema = {
  Animal: String,
  Found_near: String,
  Contact_No: Number,
  Email_ID: String,
  Image: String,
};

const Item = mongoose.model("Item", itemsSchema);

const uploadSchema = {
  ImageName: String,
};

const File = mongoose.model("File", uploadSchema);

var imageData = File.find({});

const customerSchema = {
  full_name: String,
  last_name: String,
  address: String,
  phone_num: String,
  Image: String,
};

const Customer = mongoose.model("Customer", customerSchema);

const answerSchema = {
  answer: String,
};

const Answer = mongoose.model("Answer", answerSchema);

const questionSchema = {
  question: String,
  answer: [answerSchema],
};

const Question = mongoose.model("Question", questionSchema);

const userSchema = {
  username: String,
  password: String,
};

const User = mongoose.model("User", userSchema);

var k='1';
var c='0';

app.post('/upload', upload, function(req,res) {
    var imageFile = req.file.filename;
    var success = req.file.filename + "uploaded successfully";
    var imageDetails = new Item({
      ImageName:imageFile
    });
    imageDetails.save(function(err, doc){
      if(err)
        throw err;
      imageData.exec(function(err, data){
        if(err)
          throw err;
        res.render('upload-file', {title: 'Upload File', records:data, success:'success' });
      });
    });
});

app.get('/upload', upload, function(req,res) {
  imageData.exec(function(err,data){
    if(err)
      throw err;
      res.render('upload-file', {title: 'Upload File', records:data, success:'success' })
    });
})

app.get("/report", function(req, res) {
  res.render("report", {vary: k});
});

app.get("/blog", function(req, res) {
  res.render("blog", {vary: k});
});

app.get("/qna", function(req, res) {
  Question.find({}, function(err, foundItems){
    if(err) {
      console.log(error);
    }
    else {
      res.render("qna", {newListItems: foundItems});
    }
  });
});

app.post("/question", function(req, res){
  const question = req.body.question;
  const question1 = new Question({
    question: question,
    answer: [],
  });
  question1.save();
  res.redirect("/qna");
});

app.post("/answer", function(req, res){
  const answer = req.body.answer;
  const answer1 = new Answer({
    answer: answer,
  });
  answer1.save();
  const buttonItemId = req.body.button;
  Question.findById(buttonItemId, function(err, foundItems){
    if(err) {
      console.log(err);
    } else {
      foundItems.answer.push(answer1);
      foundItems.save();
      res.redirect("/qna");
    }
  });
});

app.get("/petsold", function(req, res) {
  Customer.find({}, function(err, foundItems){
    if(err) {
      console.log(error);
    }
    else {
      res.render("petsold", {newListItems: foundItems});
    }
  });
});

app.get("/login", function(req, res) {
  res.render("login", {vary: k});
});

app.get("/signup", function(req, res) {
  res.render("signup", {vary: k});
});

app.get("/xyz", function(req, res) {
  res.render("xyz", {count: c});
});

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(err) {
      console.log(error);
    }
    else {
      res.render("list", {newListItems: foundItems, vary: k});
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  Item.find({Animal: customListName}, function(err, foundItems){
    if(err) {
      console.log(error);
    }
    else {
      res.render("customListName", {newListItems: foundItems,  vary: k});
    }
  });
});

app.post("/", upload, function(req, res) {
  // console.log(req.file);
  const animal = req.body.one;
  const found_near = req.body.two;
  const contact_no = req.body.three;
  const email_id = req.body.four;
  if(req.file == undefined) {
    res.render("report", {title: 'POST /', vary:'eee'});
  } else {
    const item1 = new Item({
      Animal: animal,
      Found_near: found_near,
      Contact_No: contact_no,
      Email_ID: email_id,
      Image: req.file.filename,
    });
    console.log(item1.Image);
    item1.save();
    res.redirect("/");
  }
});

app.post("/user", function(req, res){
  bcrypt.hash(req.body.psw, saltRounds, function(err, hash) {
    const uname = req.body.uname;
    const user1 = new User({
      username: req.body.uname,
      password: hash,
    });
    User.findOne({username: uname}, function(error, exist) {
      if(error) {
        console.log(error);
      } else {
        if (exist) {
          res.render("signup", {title: 'POST user', vary:'ccc'});
        } else {
          if(req.body.psw == req.body.repsw) {
            user1.save();
            res.redirect("/");
          } else {
            res.render("signup", {title: 'POST user', vary:'ddd'});
          }
        }
      }
    });
  });

});

app.post("/signin", function(req, res) {
      const uname = req.body.uname;
      const psw = req.body.psw;
    User.findOne({username: uname}, function(error, exist) {
      if(error) {
        console.log(error);
      } else {
        if (exist) {
          bcrypt.compare(psw, exist.password, function(err, result) {
            if(result===true) {
              Item.find({}, function(err, foundItems){
                if(err) {
                  console.log(error);
                }
                else {
                  res.render("list", {title: 'POST signin', newListItems: foundItems, vary: 'fff'});
                }
              });
            } else {
              res.render("login", {title: 'POST signin', vary:'aaa'});
            }
          });
        } else {
          res.render("login", {title: 'POST signin', vary:'bbb'});
        }
      }
    });
});

app.post("/confirm", function(req, res){
  const idn = req.body.button;
  res.render("xyz", {count: idn});
});

app.post("/adopt", upload, function(req, res) {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const addr = req.body.addr;
  const pnum = req.body.pnum;
  const buttonItemId= req.body.button;
  Item.findById(buttonItemId, function(err, foundItems){
    if(err) {
      console.log(err);
    }
    else {
      const image = foundItems.Image;
      const customer1 = new Customer({
        full_name: fname,
        last_name: lname,
        address: addr,
        phone_num: pnum,
        Image: image,
      });
      console.log(customer1.Image)
      customer1.save();
      Item.findByIdAndRemove(buttonItemId, function(err){
        if (!err) {
          console.log("Successfully deleted checked item.");
          res.redirect("/");
        }
      });
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
