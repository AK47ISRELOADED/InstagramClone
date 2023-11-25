var express = require('express');
var router = express.Router();
var usermodel =  require("./users");
var postmodel = require("./posts");
const storyModel = require("./story.js");
const commentmodel = require('./comment.js');

const passport = require('passport');
const path = require("path");
const fs = require("fs");
const multer = require("multer");
var mongoose=  require("mongoose");

const crypto = require("crypto");

const mailer = require("../nodemailer");

const localStrategy = require("passport-local");

passport.use(new localStrategy(usermodel.authenticate()));


const {Readable} = require('stream');
var id3 = require('node-id3');
const { futimesSync } = require('fs');


mongoose.connect("mongodb://127.0.0.1:27017/instagram").then(function(result){
  console.log("connected to database")
}).catch(function(err){
  console.log(err)
})

try{


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});


router.get('/feed',async function(req, res, next) {

  var currentUser = await usermodel.findOne({ username:req.session.passport.user })
  var allUsers = await usermodel.find();
  var allposts = await postmodel.find().populate('user').populate('comments').populate({path: 'comments', populate:('user')});
  var allStories = await storyModel.find().populate('user');
  // var allUsers = allUser.

  // console.log(allposts);

  res.render('feed',{currentUser,allposts,allStories,allUsers});
});




router.get('/search',async function(req, res, next) {

  
  var currentUser = await usermodel.findOne({ username:req.session.passport.user })
  var allUsers = await usermodel.find();
  var allposts = await postmodel.find().populate('user').populate('comments').populate({path: 'comments', populate:('user')});

  res.render('search',{currentUser,allUsers,allposts});
});




router.get("/storydelete", isLoggedIn, function(req, res, next){
  res.render("storydelete");
})



router.post("/searchUser", isLoggedIn,async function(req, res, next){
  // console.log(req.body.data);
  var searchedUser = await usermodel.find({
    username: {$regex: req.body.data}
  })
  
  var curentUser = await usermodel.findOne({
    username: req.session.passport.user
  })
  
  res.json({searchedUser});
})


router.post("/searchUser", isLoggedIn,async function(req, res, next){
  console.log(req);
  var searchedUser = await usermodel.find({
    username: {$regex: req.body.data}
  })
  console.log(searchedUser);
  // res.json({searchedUser});
})




router.get("/follow/:userId", isLoggedIn,async function(req, res, next){
  var currentUser = await usermodel.findById(req.user._id);

  var oppositeUser = await usermodel.findById(req.params.userId);

  var isAlreadyFollowed = await oppositeUser.follower.includes(currentUser._id);

  if(isAlreadyFollowed){
    oppositeUser.follower.pull(currentUser._id);
    currentUser.following.pull(oppositeUser._id);
    // res.json({status: "unfollowed"})
  }
  else{
    oppositeUser.follower.push(currentUser._id);
    currentUser.following.push(oppositeUser._id);
    // res.json({status: "followed"})
  }

  await currentUser.save();
  await oppositeUser.save();

  res.redirect("/feed");
})







router.post("/createStory",isLoggedIn ,async function(req, res, next){
  var newStory = new storyModel({
    media: req.body.media,
    caption: req.body.caption,
    user: req.user._id
  })

  await newStory.save();

  res.redirect("back")
})



router.get("/deleteStory/:storyId",isLoggedIn,async function(req,res,next){
  var CurrentStory = await storyModel.findOne({_id: req.params.storyId}).populate('user')

  var loggedInUser = await usermodel.findOne({username: req.session.passport.user});

  if(CurrentStory.user.username == loggedInUser.username){
    await storyModel.findOneAndDelete({
      _id: req.params.storyId
    })
  }
  else{
    // res.send("this story is not uploaded by you")
    res.redirect("/warning")
    return
  }

  res.redirect("/feed");
})


router.get("/warning", isLoggedIn, function(req, res, next){
  res.render("warning");
})







router.get("/createPost", function(req, res, next){
  res.render("createPost")
})


router.post("/createPost", isLoggedIn, async (req, res, next) =>{

  const allUsers = await usermodel.find()

  const allPosts = await postmodel.find()
  var currentuser = await usermodel.findOne({username : req.session.passport.user})

  var newPost = new postmodel({
    media: req.body.media,
    caption: req.body.caption,
    mediaType: 'image',
    user: req.user._id
  })

  await newPost.save()
  currentuser.post.push(newPost._id)
  await currentuser.save()



  res.redirect("/feed");
})







// const conn = mongoose.connection;

// var gfsBucket
// conn.once('open', () => {
//   gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
//     bucketName: 'video'
//   })

// })




// const storage = multer.memoryStorage()
// const upload = multer({ storage: storage })

// router.post('/createPost',isLoggedIn,upload.array('media') ,async (req,res,next)=>{
//   await Promise.all(req.files.map(async file=>{
//     const randomName =  crypto.randomBytes(20).toString('hex');  
//     const data = id3.read(file.buffer);
//     Readable.from(file.buffer).pipe(gfsBucket.openUploadStream(randomName))
   
 

//       var newPost = new postmodel({
//             media: req.body.media,
//             caption: req.body.caption,
//             mediaType: 'image',
//             user: req.user._id,
//             fileName: randomName,

//           })
//     //  title:songdata.title,
//     //  artist:songdata.artist,
//     //  album:songdata.album,
//     //  size: file.size,
//     //  poster: randomName + 'poster',
   
//  res.send('uploaded'); 
// })
//   )})













router.post('/reset/:userid', async function(req, res, next) {
  var user = await usermodel.findOne({_id:req.body.userid});
  if(req.body.pass1 === req.body.pass2){
 res.send("ho gyaa");

  }
});


router.get('/forgot/:id/:key', async function(req, res, next) {
 var user = await usermodel.findOne({_id:req.params.id})
  res.render('reset',{user});
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});

router.post('/forgot',async function(req, res, next) {
 var user  = await  usermodel.findOne({email:req.body.email});
 if(!user){
  res.send("we sent a mail, if the mail exists.");
 }
 else{
  //key bana rahe h 
  crypto.randomBytes(300,async function(err,buff){
    let key = buff.toString("hex");
    user.key = key;
    await user.save();
    mailer(req.body.email, user._id,key)
    await res.redirect("back")
  })

 }
});


router.get('/like/:postid',isLoggedIn, function(req, res, next) {
  usermodel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    postmodel.findOne({_id:req.params.postid})
    .then(function(post){
      if(post.likes.indexOf(foundUser._id)=== -1){
        post.likes.push(foundUser._id)
      }
      else{
        post.likes.splice(post.likes.indexOf(foundUser._id),1)
      }
      post.save()
      .then(function(){
        res.redirect("back");
      })
    })
  })
});



router.get("/savepost/:saveId", isLoggedIn,async function(req, res, next){

  var loggedInUser = await usermodel.findOne({
    username: req.session.passport.user
  })

  // console.log(loggedInUser);

  var currentPost = await postmodel.findOne({
    _id: req.params.saveId
  }).populate('user')
  
  
  if(loggedInUser.savedPosts.indexOf(currentPost._id)=== -1){
    loggedInUser.savedPosts.push(currentPost._id);
  }
  else{
    loggedInUser.savedPosts.pull(currentPost._id);
  }

  await loggedInUser.save();

  await currentPost.save();

  res.redirect("back");

})









router.post("/post",isLoggedIn, function(req,res,next){
 usermodel.findOne({username:req.session.passport.user})
 .then(function(foundUser){
  postmodel.create({
    userid: foundUser._id,
    data: req.body.post,    
  })
  .then(function(createdpost){
    foundUser.post.push(createdpost._id);
    foundUser.save()
    .then(function(){
      res.redirect("back");
    })
  })
 })
});

router.get('/profile', isLoggedIn ,async function(req,res,next) {
 var user =  await usermodel.findOne({username:req.session.passport.user})
 await user.populate("post")
 await user.populate('savedPosts')
    res.render('profile', {user});
});


router.get("/register", function(req,res){
  res.render("index")
})

router.post('/register', function(req, res, next) {
usermodel.findOne({username: req.body.username})
.then(function(foundUser){
  if (foundUser) {
    res.send("username already exists")
  }
  else{
    var newuser = new usermodel({
      username:req.body.username,
      name:req.body.name,
      email:req.body.email,
     

    })
    usermodel.register(newuser , req.body.password)
    .then(function(u){
      passport.authenticate("local")(req,res,function(){
        res.redirect("/profile");
      })
  
    })
  }
})
});



router.post('/login', passport.authenticate("local", {
  successRedirect: "/feed",
  failureRedirect: "/login"
}), function (req, res, next) {
});


router.get('/login',function(req,res,next) {
  res.render('login');
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login");
  }
}


} catch (error) {
  console.log(error)
}


module.exports = router;
