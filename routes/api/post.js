const express = require('express');
const router = express.Router();
const Post = require('../../model/Post');
const User = require('../../model/User');
const Profile = require('../../model/Profile');

const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      console.log(user.avatar);
      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (e) {
      console.log(e.message);
      res.status(500).send('Server status');
    }
  }
);
//get all post from all user
router.get('/', auth, async (req, res) => {
  try {
    const post = await Post.find().sort({ date: -1 });
    res.json(post);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server error');
  }
});
//get post by id

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});
//delete post by id

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //checks who is deleting post.By this method user who create post can only delete post if others try to delete they get error
    if (post.user.toString() !== req.user.id) {
      return res.status(400).json({
        errors: 'Not authorized',
      });
    }
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    await post.remove();
    res.json({
      msg: 'deleted',
    });
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

//Like,unlike
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if already post liked by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (e) {
    console.log(e.message);
    res.status(500).send('Server error');
  }
});
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if already post liked by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post not liked' });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (e) {
    console.log(e.message);
    res.status(500).send('Server error');
  }
});
//comment with post id

router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (e) {
      res.status(500).send('Server error');
    }
  }
);
//delete comment postid commentid

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(
      (com) => com.id === req.params.comment_id
    );
    //returns true or false
    if (!comment) {
      res.status(400).json({
        errors: 'Comment not found',
      });
    }
    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'Not authorized',
      });
    }
    const removeIndex = post.comments
      .map((com) => com.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json('Deleted comments');
  } catch (e) {
    console.error(e.message);
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
