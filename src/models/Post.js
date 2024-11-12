const mongoose = require('mongoose');
const Community = require('./Community'); 

const postSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    likesCount: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
