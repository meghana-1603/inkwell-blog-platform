
const express = require('express');
const mongoose = require('mongoose');

const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

const router = express.Router();

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function validatePost(body) {
  const { title, content, excerpt, category } = body;

  if (!title?.trim() || !content?.trim()) {
    return 'Title and content are required';
  }

  if (title.trim().length > 160) {
    return 'Title cannot exceed 160 characters';
  }

  if (content.trim().length > 20000) {
    return 'Content cannot exceed 20000 characters';
  }

  if ((excerpt || '').length > 300) {
    return 'Excerpt cannot exceed 300 characters';
  }

  if ((category || '').length > 50) {
    return 'Category cannot exceed 50 characters';
  }

  return null;
}

function postData(body) {
  return {
    title: body.title.trim(),
    content: body.content.trim(),
    excerpt: (body.excerpt || '').trim(),
    category: (body.category || 'General').trim() || 'General'
  };
}

// List posts. Supports search and category filtering.
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search?.trim()) {
      const escaped = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g, '\\$&'
      );

      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } }
      ];
    }

    if (category?.trim() && category !== 'All') {
      filter.category = category.trim();
    }

    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const postIds = posts.map(post => post._id);

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(
      commentCounts.map(item => [item._id.toString(), item.count])
    );

    res.json({
      posts: posts.map(post => ({
        ...post,
        commentCount: countMap.get(post._id.toString()) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get one post and its comments.
router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ post, comments });
  } catch (error) {
    next(error);
  }
});

// Create a post.
router.post('/', protect, async (req, res, next) => {
  try {
    const error = validatePost(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const post = await Post.create({
      ...postData(req.body),
      author: req.user.id
    });

    await post.populate('author', 'name');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    next(error);
  }
});

// Edit your own post.
router.patch('/:id', protect, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const error = validatePost(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can edit only your own posts'
      });
    }

    Object.assign(post, postData(req.body));
    await post.save();
    await post.populate('author', 'name');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    next(error);
  }
});

// Delete your own post and its comments.
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can delete only your own posts'
      });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post and its comments deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add a comment to a post.
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const content = req.body.content?.trim();

    if (!content || content.length > 2000) {
      return res.status(400).json({
        message: 'Comment must contain 1–2000 characters'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      content,
      post: post._id,
      author: req.user.id
    });

    await comment.populate('author', 'name');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
});

// Delete your own comment, or moderate comments on your own post.
router.delete(
  '/:id/comments/:commentId',
  protect,
  async (req, res, next) => {
    try {
      const { id, commentId } = req.params;

      if (!validId(id) || !validId(commentId)) {
        return res.status(400).json({ message: 'Invalid resource ID' });
      }

      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const comment = await Comment.findOne({
        _id: commentId,
        post: post._id
      });

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const isCommentAuthor =
        comment.author.toString() === req.user.id;

      const isPostAuthor =
        post.author.toString() === req.user.id;

      if (!isCommentAuthor && !isPostAuthor) {
        return res.status(403).json({
          message: 'You cannot delete this comment'
        });
      }

      await comment.deleteOne();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
