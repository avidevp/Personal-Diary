require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs=require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongooose=require("passport-local-mongoose");

const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const userSchema=new mongoose.Schema({
  email: String,
  password: String,
  blog:{
    title:[String],
    content:[String]
  }
});

userSchema.plugin(passportLocalMongooose);

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("about");
})

app.get("/login",function(req,res){
  res.render("index");
})

app.get("/register",function(req,res){
  res.render("register");
})

app.get("/posts",function(req,res){
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0')
  if(req.isAuthenticated()){
    User.findById(req.user.id,function(err,user){
      if(err)
      {
        console.log(err);

      }
      else
      {
        if(user)
        {
          res.render("posts",{fuser:user});
        }
        else
        {
          console.log("NOT AUTh");
        }
      }
    })
  }
  else{
    res.redirect("/");
  }
});
app.get("/submit",function(req,res){
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal   e=0, post-check=0, pre-check=0')
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else
  {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const titlex=req.body.title;
  const contentx=req.body.content;

  User.findById(req.user.id,function(err,user){
    if(err)
    {
      console.log(err);
    }
    else
    {
      if(user)
      {
        user.blog.title.push(titlex);
        user.blog.content.push(contentx);
        user.save(function(){
          res.redirect("/posts");
        });
      }
      else
      {
        console.log("not found");
      }
    }
  })
})

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})

app.post("/submit",function(req,res){
  const x=req.body.title;
  const y=req.body.content;
})

app.post("/register",function(req,res){
  const x=req.body.password;
  const y=req.body.pass;
  if(x!=y)
  {
    res.redirect("/register");
  }
  else
  {
    User.register({username:req.body.username},req.body.password,function(err,user){
      if(err)
      {
        console.log(err);
        res.redirect("/register");
      }
      else
      {
        passport.authenticate("local")(req,res,function(){
          res.redirect("/submit");
        })
      }
    })
  }
})

app.post("/login",passport.authenticate("local"),function(req,res){
  const user=new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user,function(err){
    if(err)
    {
      console.log(err);
    }
    else
    {
      passport.authenticate("local")(req,res,function(){

        res.redirect("/submit");
      })
    }
  })
})

app.listen(process.env.PORT||3000);
