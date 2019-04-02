const express = require('express')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express')
const path = require('path')
const pgp = require('pg-promise')()
const bcrypt = require('bcrypt')
const Comment = require('./comment.js')
const Post = require('./post.js')
const app = express()
const VIEWS_PATH = path.join(__dirname, '/views')
const connectionString = "postgres://localhost:5432/blog"
const db = pgp(connectionString)
const saltRounds = 10;

let session = require('express-session')
app.use(session({
  secret: 'Twas brillig, Raven quotes',
  resave: false,
  saveUninitialized: true
}))

let users = []
let posts = []

app.use(bodyParser.urlencoded({ extended: false }))
app.use('/css', express.static('css'))

app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials'))
app.set('views', './views')
app.set('view engine', 'mustache')


app.get('/home', (req, res) => {
  db.any("SELECT postid, title, body, timepublished, to_char(datepublished, 'dd-mm-yyyy') FROM posts WHERE ispublished = True")
  .then((posts) => {
    res.render('index', {posts: posts})
  })
})

app.get('/add-post', (req,res) => {
  res.render('add-post')
})

app.post('/add-post', (req, res) => {
  let title = req.body.title
  let body = req.body.body

  db.none('INSERT INTO posts(title, body) VALUES($1,$2);', [title, body])
  .then(() => {
    res.redirect('/home')
  }).catch(error => console.log(error))

})

app.post('/delete-post', (req, res) => {
  let postID = pasrseInt(req.body.postID)
  db.none('DELETE FROM posts WHERE postid = $1', [postID])
  .then(() => {
    res.redirect('/home')
  }).catch(error => console.log(error))
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', (req, res) => {
  let username = req.body.username
  let password = bcrypt.hashSync(req.body.password, saltRounds)
  let user = {username:username, hash:password}
  users.push(user)
  res.redirect('/login')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', (req, response) => {
  let username = req.body.username
  let persistedUser = users.find((user) => {
    return user.username == username
  })
  bcrypt.compare(req.body.password, persistedUser.hash, function(err, res) {
      if(res) {
        if(req.session){
          req.session.username = username
          response.redirect('/home')
        }
      } else {
        console.log('invalid crendentials')
      }
    })
})

app.post('/signout',(req, res) => {
  res.redirect('/')
})
app.get('/', (req, res) => {
  res.render('main')
})

app.get("/update-post/id/:postID", (req, res) => {
  let postID = parseInt(req.params.postID)
  db.one("SELECT postid, title, body FROM posts WHERE postid = $1", [postID])
  .then((post) => {
    res.render('update', post)
  })
})

app.post('/update-post', (req, res) => {
  let postID = parseInt(req.body.postID)
  let title = req.body.title
  let body = req.body.body
  db.none("UPDATE posts SET title = $1, body = $2 WHERE postid = $3;", [title,body,postID])
  .then(()=> {
    res.redirect('/home')
  })
})

app.post('/comment', (req, res) => {
  let postID = parseInt(req.body.postID)
  let comment = req.body.comment
  db.none('INSERT INTO comments(comment, postid) VALUES($1, $2);', [comment,postID])
  .then(() => {
    res.redirect('/home')
  }).catch(error => console.log(error))
})

let commentsArray = []
app.post('/view-comments', (req, res) => {
  let postID = req.body.postID
  db.any('SELECT p.postid, p.title, p.body, c.comment as "content", c.commentid FROM posts p JOIN comments c ON p.postid = c.postid;')
  .then((data) =>{
    data.forEach((item) => {
      if(posts.length == 0) {
        let post = new Post(item.title, item.body, item.postid)
        let comment = new Comment(item.content, item.commentid)
        post.comments.push(comment)
        posts.push(post)
      } else {
        let existingPost = posts.find((post) => {
          return post.postid == item.postid
        })
      }
    })
    console.log(posts)
  })
  res.redirect('/home')
})

app.listen(3000, function(){
  console.log("Another day another server ...")
})


// db.any("SELECT postid, title, body, timepublished, to_char(datepublished, 'dd-mm-yyyy') FROM posts WHERE ispublished = True")
// .then((posts) => {
//   commentsArray.push(posts)
//   db.any("SELECT commentid, comment FROM comments c JOIN posts p ON p.postid = c.postid WHERE c.postid = $1;", [postID])
//   .then((commentNumber) => {
//     console.log(commentNumber)
//     res.render('index', {comments: [1], posts: commentsArray[0], count: commentNumber.length})
//   })
// })
