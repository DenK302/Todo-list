const express = require('express')
const { ObjectId } = require("bson");
const session = require('express-session')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const app = express()
const urlencodedParser = express.urlencoded({extended: false});
const server = require('./server/server');
const passport = require('passport');


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(express.json());
app.use(session({ secret: 'you secret key' }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT, //YOUR GOOGLE_CLIENT_ID
            clientSecret: process.env.GOOGLE_KEY, //YOUR GOOGLE_CLIENT_SECRET
            callbackURL:`${process.env.DOMAIN_NAME}:${process.env.PORT}/auth/google/callback`,
        },
        (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }
    )
);

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['email', 'profile'],
    })
);

app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        successRedirect: '/',
    })
);


app.get('/signout', (req, res) => {
    try {
      req.session.destroy(function (err) {
      });
      res.redirect('/login');
    } catch (err) {
      res.status(400).send({ message: 'Failed to sign out user' });
    }
  });

app.set('view engine', 'ejs')

app.get('/', (req,res)=>{
    if(req.user){
        server.search({email: req.user._json.email}).then(function(result){
            res.render('index', {result: result, active: 'todos', name: req.user._json.name})})
    }
    else{
        res.redirect('/login')
    }
})

app.get('/create/', (req,res)=>{
    res.render('create', {active: 'create',name: req.user._json.name})
})

app.get('/todo/', (req,res)=>{
    server.search({_id: new ObjectId(req.query.id), email: req.user._json.email}).then(function(result){
        res.render('todo', {result: result[0], active: 'todo', name: req.user._json.name})
    })

})

app.post("/create/submit/", urlencodedParser, function (req, res) {
    if(!req.body) return
    server.create({title: req.body.title, description: req.body.description, date: Date.now(), email: req.user._json.email, completed: false}).then(()=>{
        res.redirect('/')
    })
});

app.post("/delete/", (req,res)=>{
    server.remove(req.query.id, req.user._json.email).then(()=>{
        res.redirect('/')
    })
})

app.post("/todo/update/", urlencodedParser, function (req, res) {
    server.update(req.query.id, {title: req.body.title, description: req.body.description, completed: (req.body.completed)?true:false}).then(()=>{
        res.redirect(`/todo/?id=${req.query.id}`)
    })
});

app.listen(process.env.PORT, () =>{
    console.log(`Server started on ${process.env.DOMAIN_NAME}:${process.env.PORT}/`)
})