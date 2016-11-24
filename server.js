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

//updating player here
router.put('/:userId/:gameId/:playerId/updateplayer', function(req, res) {
    var found = false;
    var player = req.body;

    var game = findGame(req.params.gameId);
    if( game == null ) {
        res.status(404).send('Game Not Found!');
    }

    if( !isUnique( player.name, game.players, player.id ) ) { 
        res.status(409).send('Player name already exists!');
    }
    
    var players = game.players;
    for(var i = 0; i < players.length; i++) {
        if( players[i].userId == req.params.userId  &&
            players[i].id == req.params.playerId
        ) {
            players[i] = player;
            players[i].id = req.params.playerId;
            players[i].userId = req.params.userId;
            found = true;
            break;
        }
    }
    if( !found ) {
        res.status(404).send('Player Not Found!');
    } else {
        res.send('Ok!');
    }  
});

router.put('/:userId/:gameId/updategame', function(req, res) {
    var found = false;
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == req.params.gameId &&
            games[i].userId == req.params.userId
        ) {
            var players = games[i].players;
            games[i] = req.body;
            games[i].id = req.params.gameId;
            games[i].userId = req.params.userId;
            games[i].players = players;
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
        players: [],
        gameName: 'a',
        userId: '0', //guid
        id: 0 //game id,
        hasBODCount: true, //this field may not exist. In that case, default it to false
        hasSuperOptimizer: true, //this field may not exist. In that case, default it to false
        hasBODRatings: true, //this field may not exist. In that case, default it to false
    }
*/

router.get('/:userId/:gameId/getgame', function(req, res) {
    var game = null;
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == req.params.gameId ) {
            game = games[i];
            break;
        }
    }
    res.json({game: game});   
});

/*
    player = {
        userId: '0', //user who created the player - guid
        id: '0', //guid
    }
*/

router.get('/:userId/:gameId/allplayers', function(req, res) {
    var allPlayers = [], userId = req.params.userId, gameId = req.params.gameId;
    for(var i = 0; i < games.length; i++) {
        if( games[i].id == gameId &&
            games[i].userId == userId
        ) {
            allPlayers = games[i].players;
            break;
        }
    }
    res.json({allPlayers: allPlayers});   
});

//creating players here
router.post('/:userId/:gameId/createplayer', function(req, res) {
    var player = req.body;
    var game = findGame(req.params.gameId);
    if( game == null ) {
        res.status(404).send('Game Not Found!');
    }
    //check if there is already a player with the same name
    if( !isUnique( player.name, game.players ) ) { 
        res.status(409).send('Player name already exists!');
    }
    player.id = numPlayers++;
    player.userId = req.params.userId;
    game.players.push(player);
    res.json({id: player.id});   
});

router.post('/:userId/creategame', function(req, res) {
    var game = req.body;
    game.userId = req.params.userId;
    game.id = numGames++;
    game.players = [];
    games.push(game);
    res.json({id: game.id});   
});

router.post('/:userId/duplicategame', function(req, res) {
    var gameDuplicate = findGame(req.body.id);
    if( gameDuplicate == null ) {
        res.status(404).send('Game Not Found!');
    }
    var newGame = req.body;
    var players = clone(gameDuplicate.players);
    newGame.id = numGames++;
    newGame.userId = req.params.userId;
    newGame.players = players;
    games.push(newGame);
    res.json({id: newGame.id});   
});

router.delete('/:userId/:gameId/:playerId/deleteplayer', function(req, res) {
    var game = findGame(req.params.gameId);
    if( game == null ) {
        res.status(404).send('Game Not Found!');
    }
    var players = game.players;
    var found = false;
    var i;
    for( i = 0; i < players.length; i++) {
        if( players[i].id == req.params.playerId &&
            players[i].userId == req.params.userId
        ) {
            found = true;
            break;
        }
    }
    if( !found ) {
        res.status(404).send('No Player found!');
    }
    players.splice(i,1);
    res.status(200).send('Player Deleted!');
});

router.delete('/:userId/:gameId/deletegame', function(req, res) {
    var allGames = findGames(req.params.userId);
    var found = false;
    for( var i = 0; i < games.length; i++) {
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

var isUnique = function( name, array, playerId ) {
    for(var i = 0; i < array.length; i++) {
        if(array[i].name == name) {
            if( playerId !== undefined && playerId != array[i].id ) {
                return false
            }
        }
    }
    return true;
}

var clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = {};
    if( obj.length !== undefined ) {
        var arrayCopy = [];
        for(var i = 0; i < obj.length; i++) {
            var objInArray = obj[i];
            if( objInArray.length !== undefined ) {
            arrayCopy[i] = clone(objInArray);
            } else {
            copy = {};
            for (var attr in objInArray) {
                if (objInArray.hasOwnProperty(attr)) {
                    copy[attr] = clone(objInArray[attr]);
                }
            }
            arrayCopy[i] = copy;
            }
        }
        return arrayCopy;
    } else {
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = clone(obj[attr]);
            }
        }
    }
    return copy;
}