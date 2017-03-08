var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var config = {
    user : 'nbandi7',
    database : 'nbandi7',
    host : 'db.imad.hasura-app.io',
    port : '5432',
    password : process.env.DB_PASSWORD
};

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30}
}));


var counter=0;
app.get('/counter', function (req, res) {
  counter=counter+1;
  res.send(counter.toString());
});

function createTemplate(Data){
    var title = data.title;
    var date = data.date;
    var heading = data.heading;
    var content = data.content;
    
    var htmlTemplate = `
    <html>
    <head>
	<title>
		${title}
	</title>
	<meta name="viewport" content="width-device-width,initial-scale=1"/>
	<link rel="stylesheet" type="text/css" href="/ui/style.css">
    </head>
    <body>
    	<div class="container">
    		<div>
    			<a href="/">Home</a>
    		</div>
    		<hr>
    		<h3>
    			${heading}
    		</h3>
    		<div>
    			${date.toDateString()}
    		</div>
    		<div>
    			${content}
    		</div>
    	</div>
    
    </body>
    </html>
    `;
    return htmlTemplate;
}

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

function hash(string,salt){
    var hash = crypto.pbkdf2Sync(string, salt, 100000, 512, 'sha512');
    return ["pbkdf2","100000",salt,hash.toString('hex')].join('$');
}

app.get('/hash/:input',function(req,res){
    var hashedString = hash(req.params.input , 'this-is-some-random-string');
    res.send(hashedString) ;
});

app.post('/create-user',function(req,res){
    
    var username = req.body.username;
    var password = req.body.password;
    
    var salt = crypto.randomBytes(128).toString('hex');
    var dbString = hash(password,salt);
    pool.query('INSERT INTO "user" (username,password) VALUES ($1 ,$2)',[username,dbString],function(err,result){
        
        if(err){
            res.status(500).send(err.toString());
        }else{
            res.send("USER SUCCESSFULLY CREATED "+username);
        }
    });
});
app.post('/login',function(req,res){
    
    var username = req.body.username;
    var password = req.body.password;
    
    

    pool.query('SELECT * FROM "user" WHERE username = $1',[username],function(err,result){
        
        if(err){
            res.status(500).send(err.toString());
        }else{
            if(result.rows.length === 0){
                res.status(403).send('username/password is invalid !');
            }else{
               var dbString = result.rows[0].password;
                var salt = dbString.split('$')[2];
                var hashedP = hash(password,salt);
                if(hashedP === dbString  ){
                    req.session.auth = {userId:result.rows[0].id};
                    res.send(username);
                    
                  }else{
                     res.status(403).send('username/password is invalid !');
                 } 
                
            }
            
            
        }
        
    });
 
        
});

app.get('/check-login', function (req, res) {
   if (req.session && req.session.auth && req.session.auth.userId) {
       // Load the user object
       pool.query('SELECT * FROM "user" WHERE id = $1', [req.session.auth.userId], function (err, result) {
           if (err) {
              res.status(500).send(err.toString());
           } else {
              res.send(result.rows[0].username);
           }
       });
   } else {
       res.status(400).send('<center><img src="http://cdn.appthemes.com/wp-content/uploads/2013/03/not-logged-in.png" alt="Not Logged In !"></center>');
   }
});



app.get('/logout',function(req,res){
    delete req.session.auth;
    res.send('<center><img src="http://www.carshowsafari.com/images/logged_out/successfully-logged-out.png" alt="successfully logged Out !"><br><a href="http://nbandi7.imad.hasura-app.io/">Go To Home Page !</a><center>');
});



var pool = new Pool(config);
app.get('/test-db',function(req,res){
    pool.query('SELECT * FROM test',function(err,result){
        if(err){
            res.status(500).send(err.toString());
        } else {
            res.send(JSON.stringify(result.rows));
        }
    });
});

app.get('/articles/:articleName', function (req, res) {
  // SELECT * FROM article WHERE title = '\'; DELETE WHERE a = \'asdf'
  pool.query("SELECT * FROM article WHERE title = $1", [req.params.articleName], function (err, result) {
    if (err) {
        res.status(500).send(err.toString());
    } else {
        if (result.rows.length === 0) {
            res.status(404).send('Article not found');
        } else {
            var articleData = result.rows[0];
            res.send(createTemplate(articleData));
        }
    }
  });
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});

app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

var names = [];
app.get('/submit-name/:name',function(req,res){
   var name = req.params.name; //TODO
   
   names.push(name);
   //JSON
   res.send(JSON.stringify(names));
});

var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
