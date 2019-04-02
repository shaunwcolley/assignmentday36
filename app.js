const express = require('express')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express')
const path = require('path')
const pgp = require('pg-promise')()
const bcrypt = require('bcrypt')
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

// let passwords = []
//
// bcrypt.hash("Scooby-doo", saltRounds, function(err, hash) {
//   passwords.push(hash)
//   console.log(hash)
//   console.log(passwords)
//   bcrypt.compare("Scooby-doo", passwords[0], function(err, res) {
//     console.log(res)
//   })
// })


let users = []

app.use(bodyParser.urlencoded({ extended: false }))
app.use('/css', express.static('css'))

app.engine('mustache', mustacheExpress(VIEWS_PATH + '/partials'))
app.set('views', './views')
app.set('view engine', 'mustache')


app.get('/home', (req, res) => {
  db.any("SELECT postid, title, body, timepublished, to_char(datepublished, 'dd-mm-yyyy') FROM posts")
  .then((posts) => {
    res.render('index.mustache', {posts: posts})
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
    console.log('success')
    res.redirect('/home')
  }).catch(error => console.log(error))

})

app.post('/delete-post', (req, res) => {
  let postID = req.body.postid

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
          console.log(req.session.username)
        }
      } else {
        console.log('invalid crendentials')
      }
    })
  console.log(persistedUser)
  response.redirect('/home')
})

app.post('/signout',(req, res) => {
  res.redirect('/')
})
app.get('/', (req, res) => {
  res.render('main')
})

app.post('/update-post', (req, res) => {
  let updateid = req.body.updateid
  res.render('update-post', {postid: updateid})
})

app.listen(3000, function(){
  console.log("Another day another server ...")
})
