import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для комментариев
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Виртуальное поле для количества лайков
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

const Post = mongoose.model('Post', postSchema);

export default Post; 