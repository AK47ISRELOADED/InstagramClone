var mongoose=  require("mongoose");
var plm = require("passport-local-mongoose");


var userSchema = mongoose.Schema({

  username: {
    type: String,
    require: true,
    unique: true
  },
  image: {
    type: String,
    default: '/images/userdef.png',
  },
  name: {
    type: String,
    require: true
  },
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  follower:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  bio: {
    type: String,
    default: 'instagram user',
  },
  savedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  password:String,
  email:String,
  key: String,
  post:[
    { type:mongoose.Schema.Types.ObjectId, ref:"post"}
  ]
})
userSchema.plugin(plm);

module.exports = mongoose.model("user",userSchema);