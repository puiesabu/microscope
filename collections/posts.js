Posts = new Meteor.Collection('posts');

Posts.allow({
  update: ownsDocument,
  remove: ownsDocument
});

Posts.deny({
  update: function(userId, post, fieldNames) {
    // may only edit te following two fields:
    return (_.without(fieldNames, 'url', 'title').length > 0);
  }
});

Meteor.methods({
  post: function(postAttributes) {
    var user = Meteor.user(),
      postWithSameLink = Posts.findOne({url: postAttributes.url});

    // ensure the user is logged in
    if(!user)
      throw new Meteor.Error(401, "You need to login to post new stories");

    // ensure the post has a title
    if(!postAttributes.title)
      throw new Meteor.Error(422, "Please fill in a headline");

    // check that there are no previous post with the same link
    if(postAttributes.url && postWithSameLink) {
      throw new Meteor.Error(302, "This link has already been posted", postWithSameLink._id);
    }

    // pick out the whiltlisted keys
    var post = _.extend(_.pick(postAttributes, "url", "title", "message"), {
      title: postAttributes.title + (this.isSimulation ? "(client)" : "(server)"),
      userId: user._id,
      author: user.username,
      submitted: new Date().getTime(),
      commentsCount: 0,
      upvoters: [], 
      votes: 0
    });

    // wait for 5 seconds
    if(!this.isSimulation) {
      var Future = Npm.require("fibers/future");
      var future = new Future();
      Meteor.setTimeout(function() {
        future.return();
      }, 5 * 1000);
      future.wait();
    }

    var postId = Posts.insert(post);

    return postId;
  },

  upvote: function(postId) {
    var user = Meteor.user();

    // ensure the user is logged in
    if (!user)
      throw new Meteor.Error(401, "You need to login to post new stories");

    var post = Posts.findOne(postId);
    if (!post)
      throw new Meteor.Error(422, "Post not found");

    if (_.include(post.upvoters, user._id))
      throw new Meteor.Error(422, "Already upvoted this post");

    Posts.update({
      _id: post._id,
      upvoters: {$ne: user._id}
    }, {
      $addToSet: {upvoters: user._id},
      $inc: {votes: 1}
    });
  }
});
