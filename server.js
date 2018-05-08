const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const Commands = require('./commands');
const Player = require('./player');
const Game = require('./game');
let maxPlayers = 4,
  gameSize = 8,
  players = [],
  turn = 0,
  game;

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.on('error', err => {
  console.log(`server error:\n${err.stack}`);
  //send  to players if on server is any error
  for (let player of players) {
    server.send(
      Buffer.from(Buffer.from(Commands.ERROR)),
      player.port,
      player.address,
      err => {}
    );
  }
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  let command = msg.toString().split(' ');
  switch (command[0]) {
    //connect player
    case 'connect':
      connectPlayer(rinfo, command[1]);
      break;
    //player made move
    case Commands.MOVE:
      turnResolve(command[1], parseInt(command[2]), parseInt(command[3]));
      break;
  }
});

server.bind(41234);
// server listening 0.0.0.0:41234

function connectPlayer(rinfo, name) {
  //if players is less than maximum
  if (players.length < maxPlayers) {
    //add new player to array
    players.push(new Player(rinfo.address, rinfo.port, name));
    //send info that player is in the game
    server.send(
      Buffer.from(Buffer.from(Commands.CONNECTED)),
      rinfo.port,
      rinfo.address,
      err => {}
    );
    // if max players are in the game
    if (players.length === maxPlayers) {
      // create string with list of player name
      let list = '';
      for (let player of players) {
        list += ' ' + player.name;
      }

      for (let player of players) {
        //for each player send info about game, board size and player names
        server.send(
          Buffer.from(`${Commands.START} ${gameSize + list}`),
          player.port,
          player.address,
          err => {}
        );
        game = new Game(gameSize);
        let tempPlayers = [];
        for (let player of players) {
          tempPlayers.push(player.name);
        }
        //add players to game
        game.addPlayers(tempPlayers);
      }
      // send info for player who have turn
      sendTurn();
    }
  } else {
    //send info that server is full
    server.send(
      Buffer.from(Commands.SERVERFULL),
      rinfo.port,
      rinfo.address,
      err => {}
    );
  }
}

function turnResolve(name, x, y) {
  for (let player of players) {
    //for each player send info about move(player, x ,y)
    server.send(
      Buffer.from(`${Commands.MOVE} ${name} ${x} ${y}`),
      player.port,
      player.address,
      err => {}
    );
  }
  // add move to board
  game.add(name, parseInt(x), parseInt(y));
  //show board
  displayBoard();
  // send to player who have turn info about that
  sendTurn();
}

function removePlayer(i) {
  server.send(
    Buffer.from(Commands.DISCONNECTED),
    players[i].port,
    players[i].address,
    err => {}
  );
  players.splice(i, 1);
}
function sendTurn() {
  turn = turn >= players.length - 1 ? 0 : turn + 1;

  let isOnBoard = game.playersOnBoard().indexOf(players[turn].name) >= 0;
  let playersOnBoard = game.playersOnBoard().length;
  if (playersOnBoard == 1 && isOnBoard) {
    server.send(
      Buffer.from(Commands.WIN),
      players[turn].port,
      players[turn].address,
      err => {
        server.close();
      }
    );
    removePlayer(turn);
  } else if (!isOnBoard) {
    server.send(
      Buffer.from(Commands.LOSE),
      players[turn].port,
      players[turn].address,
      err => {}
    );
    removePlayer(turn);
    sendTurn();
  } else
    server.send(
      Buffer.from(Commands.YOURTURN),
      players[turn].port,
      players[turn].address,
      err => {}
    );
}

function displayBoard() {
  let yrows = '\x1b[47m\x1b[30m  ';
  for (let i = 0; i < game.map_.length; i++) yrows += i + ' ';
  yrows += '\x1b[0m';
  console.log(yrows);

  for (let y = 0; y < game.map_.length; y++) {
    let row = '';
    for (let x = 0; x < game.map_.length; x++) {
      if (x == 0) row += '\x1b[47m\x1b[30m' + y + ' \x1b[0m';
      if (game.map_[y][x].playerName == null) {
        row += '\x1b[37m' + game.map_[y][x].points;
      } else if (
        players[0] != undefined &&
        game.map_[y][x].playerName == players[0].name
      ) {
        row += '\x1b[32m' + game.map_[y][x].points;
      } else if (
        players[1] != undefined &&
        game.map_[y][x].playerName == players[1].name
      ) {
        row += '\x1b[33m' + game.map_[y][x].points;
      } else if (
        players[2] != undefined &&
        game.map_[y][x].playerName == players[2].name
      ) {
        row += '\x1b[34m' + game.map_[y][x].points;
      } else if (
        players[3] != undefined &&
        game.map_[y][x].playerName == players[3].name
      ) {
        row += '\x1b[35m' + game.map_[y][x].points;
      }
      row += ' \x1b[0m';
    }
    console.log(row);
  }
  console.log();
}
