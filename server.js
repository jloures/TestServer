// server.js

// BASE SETUP
// =============================================================================

//these are the globals for our server (everything will be in memory)
var users = [];

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/login', function(req, res) {
    var index = findUser(req.body.username)
    if( index > -1 ) {
        res.json(req.body);
    } else {
        res.status(404).send('No User found!');
    }  
});

router.post('/signup', function(req, res) {
    if( (findUser(req.body.username) === -1) && (findEmail(req.body.email) === -1)) {
        users.push(req.body);
        res.json(req.body);
    } else {
        res.status(409).send('Conflict!');
    }  
});

router.post('/recovery', function(req, res) {
    res.json(req.body);   
});


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

var findUser = function(username) {
    var index = -1;
    for(var i = 0; i < users.length; i++) {
        if(users[i].username === username ) {
            index = i;
            break;
        }
    }
    return index;
}

var findEmail = function(email) {
    var index = -1;
    for(var i = 0; i < users.length; i++) {
        if(users[i].email === email ) {
            index = i;
            break;
        }
    }
    return index;
}