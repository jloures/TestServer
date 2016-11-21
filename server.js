// server.js

// BASE SETUP
// =============================================================================

//these are the globals for our server (everything will be in memory)
//this is just a testserver, so this is the way I found of creating unique ids quickly
var numUsers = 0;
var numGames = 0;
var numPlayers = 0;
var users = [];
var games = [];
var players = [];

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 4000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/login', function(req, res) {
    var index = findUser(req.body.username)
    if( index > -1 ) {
        if( users[index].passwd === req.body.passwd ) {
            var userId = users[index].userId;
            var allGames = findGames(userId);
            res.json({
                userId: userId,
                allGames: allGames
            });
        } else {
            res.status(401).send('Incorrect username or password!');
        }    
    } else {
        res.status(404).send('No User found!');
    }  
});

router.post('/signup', function(req, res) {
    if( (findUser(req.body.username) === -1) && (findEmail(req.body.email) === -1)) {
        var user = req.body;
        user.userId = numUsers++;
        users.push(user);
        res.json(user);
    } else {
        res.status(409).send('Conflict!');
    }  
});

router.post('/recovery', function(req, res) {
    res.json(req.body);   
});

router.get('/:userId/allgames', function(req, res) {
    var allGames = findGames(req.params.userId);
    res.json({allGames: allGames});   
});

router.put('/:userId/:gameId', function(req, res) {
    var found = false;
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == req.params.gameId ) {
            games[i] = req.body;
            games[i].id = req.params.gameId;
            games[i].userId = req.params.userId;
            found = true;
            break;
        }
    }
    if( !found ) {
        res.status(404).send('Game Not Found!');
    } else {
        res.send('Ok!');
    }  
});

/*
    var game = { 
        teamA: { name: 'Light' },
        teamB: { name: 'Dark' },
        gameName: 'a',
        userId: '0', //guid
        id: 0 //game id,
        hasBODCount: true, //this field may not exist. In that case, default it false
        hasSuperOptimizer: true, //this field may not exist. In that case, default it false
        hasBODRatings: true, //this field may not exist. In that case, default it false
    }
*/

router.get('/:userId/:gameId', function(req, res) {
    var game = null;
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == req.params.gameId ) {
            game = games[i];
        }
    }
    res.json({game: game});   
});

/*
    player = {
        games: [1,2,3,5,10,8], //array of games they are part of
        userId: '0', //guid
        id: '0', //guid
    }
*/

router.get('/:userId/:gameId/allplayers', function(req, res) {
    var players = [], userId = req.params.userId, gameId = req.params.gameId;
    for(var i = 0; i < players.length; i++) {
        var games = players[i].games;
        for(var j = 0; j < games.length; j++) {
            if(games[j] == gameId) {
                //we have found our player
                players.push(players[i]);
            }
        }
    }
    res.json({allPlayers: players});   
});

//creating players here
router.post('/:userId/createplayer', function(req, res) {
    var player = req.body;
    player.userId = req.params.userId;
    player.id = numPlayers++;
    players.push(player);
    console.log("Create Player:");
    console.log(player);
    res.json({id: player.id});   
});

router.post('/:userId/creategame', function(req, res) {
    var game = req.body;
    game.userId = req.params.userId;
    game.id = numGames++;
    games.push(game);
    console.log("Create Game:");
    console.log(game);
    res.json({id: game.id});   
});

router.delete('/:userId/:gameId', function(req, res) {
    var allGames = findGames(req.params.userId);
    var i, found = false;
    for( i = 0; i < games.length; i++) {
        if( games[i].id == req.params.gameId ) {
            found = true;
            break;
        }
    }
    if( !found ) {
        res.status(404).send('No Game found!');
    }
    games.splice(i,1);
    res.status(200).send('Game Deleted!');
});


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

var findGames = function(userId) {
    var allGames = [];
    for(var i = 0; i < games.length; i++ ) {
        if( games[i].userId == userId ) {
            allGames.push(games[i]);
        }
    }
    return allGames;
}

var findGame = function(gameId) {
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == gameId ) {
            return games[i];
        }
    }
    return null;
}

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