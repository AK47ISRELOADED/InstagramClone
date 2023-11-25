const mongoose = require("mongoose");

const storySchema = mongoose.Schema({
    media: {
        type: String,
        require: true
    },
    caption: {
        type: String
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    }
},{
    timestamps: true
})

storySchema.index({
    createdAt: 1
},{
    expireAfterSeconds : 24 * 60 * 60
})

module.exports = mongoose.model("story", storySchema);