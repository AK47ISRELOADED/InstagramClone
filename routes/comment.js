const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    text: {
        type: String,
        require: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        }
    ],
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
        require: true
    },
    replyOf:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment"
    }
},{
    timestamps: true
})


module.exports = mongoose.model("comment", commentSchema);