class Post {
  constructor(title,body,postid,to_char,timepublished) {
    this.title = title
    this.body = body
    this.postid = postid
    this.to_char = to_char
    this.timepublished = timepublished
    this.comments = []
  }
}

module.exports = Post
