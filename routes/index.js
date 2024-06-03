var express = require("express");
var router = express.Router();
var usermodel = require("./users");
var postmodel = require("./posts");
const storyModel = require("./story.js");
const commentmodel = require("./comment.js");
var chatmodel = require("./chat.js");

const passport = require("passport");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
var mongoose = require("mongoose");

const crypto = require("crypto");

const mailer = require("../nodemailer.js");

const localStrategy = require("passport-local");

passport.use(new localStrategy(usermodel.authenticate()));

const { Readable } = require("stream");
var id3 = require("node-id3");
const { futimesSync } = require("fs");
const { render } = require("ejs");

mongoose
  .connect(
    "mongodb+srv://adarshkaurav47:NMQNLBgqetajt3BC@cluster0.htey9n7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(function (result) {
    console.log("connected to database");
  })
  .catch(function (err) {
    console.log(err);
  });

const conn = mongoose.connection;
var gfsBucket;
conn.once("open", () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "media",
  });
});

try {
  /* GET home page. */
  router.get("/", function (req, res, next) {
    res.render("index");
  });

  router.get("/feed", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
      // console.log(currentUser);
      // rest of your code
    } else {
      // handle unauthenticated users
      res.render("notfound");
    }
    var allUsers = await usermodel.find();
    var allposts = await postmodel
      .find()
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });
    var allStories = await storyModel.find().populate("user");

    res.render("feed", { currentUser, allposts, allStories, allUsers });
  });

  router.get("/reel", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var posts = await postmodel
      .find()
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });

    res.render("reels", { posts, currentUser });
  });

  router.get("/reel/:reelid", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var posts = await postmodel
      .find()
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });
    var personalreel = await postmodel
      .findOne({ _id: req.params.reelid })
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });

    res.render("reelpersonal", { posts, personalreel, currentUser });
  });

  router.get("/post/:postid", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var posts = await postmodel
      .find()
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });

    var personalpost = await postmodel
      .findOne({ _id: req.params.postid })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });

    res.render("postpersonal", { posts, personalpost, currentUser });
  });

  router.get("/dm", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var allUsers = await usermodel.find().populate("follower");

    res.render("dm", { currentUser, allUsers });
  });

  router.get("/dm/:userid", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var user = await usermodel.findOne({ _id: req.params.userid });
    var allUsers = await usermodel.find().populate("follower");
    var allmsg = await chatmodel.find();

    res.render("dmuser", { currentUser, allUsers, user, allmsg });
  });

  router.post(
    "/send-msg/:recieverid/:senderid",
    async function (req, res, next) {
      await chatmodel.create({
        sender_id: req.params.senderid,
        receiver_id: req.params.recieverid,
        message: req.body.message,
      });
      res.redirect("back");
    }
  );

  router.get("/search", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var allUsers = await usermodel.find();
    var allposts = await postmodel
      .find()
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });

    res.render("search", { currentUser, allUsers, allposts });
  });

  router.get("/storydelete", isLoggedIn, function (req, res, next) {
    res.render("storydelete");
  });

  router.post("/searchUser", isLoggedIn, async function (req, res, next) {
    // console.log(req.body.data);
    var searchedUser = await usermodel.find({
      username: { $regex: req.body.data },
    });

    var curentUser = await usermodel.findOne({
      username: req.session.passport.user,
    });

    res.json({ searchedUser });
  });

  // router.post("/searchUser", isLoggedIn,async function(req, res, next){
  //   // console.log(req);
  //   var searchedUser = await usermodel.find({
  //     username: {$regex: req.body.data}
  //   })
  //   // console.log(searchedUser);
  //   // res.json({searchedUser});
  // })

  router.get("/follow/:userId", isLoggedIn, async function (req, res, next) {
    var currentUser = await usermodel.findById(req.user._id);

    var oppositeUser = await usermodel.findById(req.params.userId);

    var isAlreadyFollowed = await oppositeUser.follower.includes(
      currentUser._id
    );

    if (isAlreadyFollowed) {
      oppositeUser.follower.pull(currentUser._id);
      currentUser.following.pull(oppositeUser._id);
      // res.json({status: "unfollowed"})
    } else {
      oppositeUser.follower.push(currentUser._id);
      currentUser.following.push(oppositeUser._id);
      // res.json({status: "followed"})
    }

    await currentUser.save();
    await oppositeUser.save();

    res.redirect("/feed");
  });

  router.get("/userstory", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }

    var allstories = await storyModel.find().populate("user");

    // console.log("story",story);
    res.render("userstory", { currentUser, allstories });
  });

  router.get("/veiwstory", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }

    var allstories = await storyModel.find().populate("user");
    res.render("viewstory", { currentUser, allstories });
  });

  router.post("/createStory", isLoggedIn, async function (req, res, next) {
    var newStory = new storyModel({
      media: req.body.media,
      caption: req.body.caption,
      user: req.user._id,
    });
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }

    await newStory.save();
    await currentUser.story.push(newStory._id);
    await currentUser.save();

    res.redirect("back");
  });

  router.get(
    "/deleteStory/:storyId",
    isLoggedIn,
    async function (req, res, next) {
      var CurrentStory = await storyModel
        .findOne({ _id: req.params.storyId })
        .populate("user");

      var loggedInUser = await usermodel.findOne({
        username: req.session.passport.user,
      });

      if (CurrentStory.user.username == loggedInUser.username) {
        await storyModel.findOneAndDelete({
          _id: req.params.storyId,
        });
      } else {
        // res.send("this story is not uploaded by you")
        res.redirect("/warning");
        return;
      }

      res.redirect("/feed");
    }
  );
  router.get(
    "/deletepost/:postId",
    isLoggedIn,
    async function (req, res, next) {
      var Currentpost = await postmodel
        .findOne({ _id: req.params.postId })
        .populate("user");

      var loggedInUser = await usermodel.findOne({
        username: req.session.passport.user,
      });

      if (Currentpost.user.username == loggedInUser.username) {
        await postmodel.findOneAndDelete({
          _id: req.params.postId,
        });
      } else {
        // res.send("this story is not uploaded by you")
        res.redirect("/warning");
        return;
      }

      res.redirect("/feed");
    }
  );

  router.get("/warning", isLoggedIn, function (req, res, next) {
    res.render("warning");
  });

  router.get("/createPost", function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    res.render("createPost", { currentUser });
  });

  // const storage = multer.memoryStorage()
  // const upload = multer({ storage: storage })

  // router.post('/createPost',upload.single('media') ,async (req,res,next)=>{
  //   // console.log(req.file);
  //   console.log(req.file.buffer);
  //   Readable.from(req.file.buffer).pipe(gfsBucket.openUploadStream(req.file.originalname))

  //   await postmodel.create({

  // name: req.file.originalname,
  // media:req.file._id,
  // caption: req.body.caption,
  // user: req.user._id,
  // mediaType : req.file.mimetype ,

  //   })

  //  res.send('uploaded');
  // })

  // router.get('/stream/:musicName', async (req,res,next)=>{
  //   var currentSong = await postmodel.findOne({
  //     name: req.params.musicName,
  //   })

  //   console.log(currentSong);

  //    const stream =  gfsBucket.openDownloadStreamByName(req.params.musicName)

  //    res.set('Content-Type', 'video/mp4')
  //    res.set('Content-Length', currentSong.size + 1)
  //    res.set('Content-Range', `bytes 0-${currentSong.size - 1}/${currentSong.size}`)
  //    res.set('Content-Ranges', 'bytes')
  //    res.status(206)

  //    stream.pipe(res)
  // })

  // router.post("/createPost", isLoggedIn, async (req, res, next) =>{

  //   var currentuser = await usermodel.findOne({username : req.session.passport.user})

  //   var newPost = new postmodel({
  //     media: req.body.media,
  //     caption: req.body.caption,
  //     user: req.user._id
  //   })

  //   await newPost.save()
  //   currentuser.post.push(newPost._id)
  //   await currentuser.save()

  //   res.redirect("/profile");
  // })

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/uploads");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);
      cb(null, uniqueSuffix);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 1000000000000000 },
  });

  router.post("/createPost", upload.single("media"), async (req, res, next) => {
    var currentuser = await usermodel.findOne({
      username: req.session.passport.user,
    });

    var newPost = new postmodel({
      media: req.file.filename,
      caption: req.body.caption,
      user: req.user._id,
      mediaType: req.file.mimetype,
    });

    await newPost.save();
    currentuser.post.push(newPost._id);
    await currentuser.save();

    res.redirect("/profile");
  });

  router.post(
    "/addComment/:postId",
    isLoggedIn,
    async function (req, res, next) {
      var currentPost = await postmodel.findOne({
        _id: req.params.postId,
      });

      var loggedInUser = await usermodel.findOne({
        username: req.session.passport.user,
      });

      var newComment = await commentmodel.create({
        text: req.body.comment,
        user: loggedInUser._id,
        post: currentPost._id,
      });

      currentPost.comments.push(newComment._id);

      await currentPost.save();

      res.redirect("back");
    }
  );

  router.get("/delete/:commentId", async function (req, res, next) {
    var loggedInUser = await usermodel.findOne({
      username: req.session.passport.user,
    });

    var currentComment = await commentmodel
      .findOne({
        _id: req.params.commentId,
      })
      .populate("user");

    var currentPost = await postmodel
      .findOne({
        _id: currentComment.post,
      })
      .populate("user");

    if (
      currentComment.user.username == loggedInUser.username ||
      currentPost.user.username == loggedInUser.username
    ) {
      await commentmodel.findOneAndDelete({
        _id: currentComment._id,
      });
    } else {
      res.json({
        data: "you cant delete this comment as this is not your post",
      });
      return;
    }

    await currentPost.comments.pull(currentComment._id);

    currentPost.save();

    res.redirect("back");
  });

  router.get("/likeComment/:commentid", isLoggedIn, function (req, res, next) {
    usermodel
      .findOne({ username: req.session.passport.user })
      .then(function (foundUser) {
        commentmodel
          .findOne({ _id: req.params.commentid })
          .then(function (comment) {
            if (comment.likes.indexOf(foundUser._id) === -1) {
              comment.likes.push(foundUser._id);
            } else {
              comment.likes.splice(comment.likes.indexOf(foundUser._id), 1);
            }
            comment.save().then(function () {
              res.redirect("back");
            });
          });
      });
  });

  router.post("/reset/:userid", async function (req, res, next) {
    var user = await usermodel.findOne({ _id: req.body.userid });
    if (req.body.pass1 === req.body.pass2) {
      res.send("ho gyaa");
    }
  });

  router.get("/forgot/:id/:key", async function (req, res, next) {
    var user = await usermodel.findOne({ _id: req.params.id });
    res.render("reset", { user });
  });

  router.get("/forgot", function (req, res, next) {
    res.render("forgot");
  });

  router.post("/forgot", async function (req, res, next) {
    var user = await usermodel.findOne({ email: req.body.email });
    if (!user) {
      res.send("we sent a mail, if the mail exists.");
    } else {
      //key bana rahe h
      crypto.randomBytes(30, async function (err, buff) {
        let key = buff.toString("hex");
        user.key = key;
        await user.save();
        await mailer(req.body.email, user._id, key);
        res.redirect("back");
      });
    }
  });

  router.get("/like/:postid", isLoggedIn, function (req, res, next) {
    usermodel
      .findOne({ username: req.session.passport.user })
      .then(function (foundUser) {
        postmodel.findOne({ _id: req.params.postid }).then(function (post) {
          if (post.likes.indexOf(foundUser._id) === -1) {
            post.likes.push(foundUser._id);
          } else {
            post.likes.splice(post.likes.indexOf(foundUser._id), 1);
          }
          post.save().then(function () {
            res.redirect("back");
          });
        });
      });
  });

  router.get("/savepost/:saveId", isLoggedIn, async function (req, res, next) {
    var loggedInUser = await usermodel.findOne({
      username: req.session.passport.user,
    });

    // console.log(loggedInUser);

    var currentPost = await postmodel
      .findOne({
        _id: req.params.saveId,
      })
      .populate("user");

    if (loggedInUser.savedPosts.indexOf(currentPost._id) === -1) {
      loggedInUser.savedPosts.push(currentPost._id);
    } else {
      loggedInUser.savedPosts.pull(currentPost._id);
    }

    await loggedInUser.save();

    await currentPost.save();

    res.redirect("back");
  });

  router.post(
    "/updateprofile",
    upload.single("dp"),
    isLoggedIn,
    async function (req, res, next) {
      var currentUser = await usermodel.findOneAndUpdate(
        { _id: req.user },
        {
          image: req.file.filename,
          bio: req.body.bio,
          name: req.body.name,
        }
      );
      res.redirect("/profile");
    }
  );

  router.get("/profile/:userid", async function (req, res, next) {
    if (req.isAuthenticated()) {
      var currentUser = req.user;
    } else {
      res.render("notfound");
    }
    var post = await postmodel.find();
    var User = await usermodel
      .findOne({ _id: req.params.userid })
      .populate("post");
    res.render("userprofile", { currentUser, User, post });
  });

  router.get("/profile", isLoggedIn, async function (req, res, next) {
    var currentUser = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate("post");
    var currentUser2 = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate("savedPosts");
    // await currentUser.populate('savedPosts')
    // console.log("current user" , currentUser ,"saved",currentUser.savedPosts );
    var post = await postmodel
      .find()
      .sort({ createdAt: 1 })
      .populate("user")
      .populate("comments")
      .populate({ path: "comments", populate: "user" });
    res.render("profile", { currentUser, post, currentUser2 });
  });

  router.get("/register", function (req, res) {
    res.render("index");
  });

  router.post("/register", function (req, res, next) {
    usermodel
      .findOne({ username: req.body.username })
      .then(function (foundUser) {
        if (foundUser) {
          res.send("username already exists");
        } else {
          var newuser = new usermodel({
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
          });
          usermodel.register(newuser, req.body.password).then(function (u) {
            passport.authenticate("local")(req, res, function () {
              res.redirect("/profile");
            });
          });
        }
      });
  });

  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/feed",
      failureRedirect: "/login",
    }),
    function (req, res, next) {}
  );

  router.get("/login", function (req, res, next) {
    res.render("login");
  });

  router.get("/logout", function (req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/login");
    });
  });

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/login");
    }
  }
} catch (error) {
  render("notfound");
  console.log(error);
}

module.exports = router;
