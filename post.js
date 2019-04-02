class Post {
  constructor(title,body,postid) {
    this.title = title
    this.body = body
    this.postid = postid
    this.comments = []
  }
}

module.exports = Post
