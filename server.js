const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const Commands = require('./commands');
const Player = require('./player');
let maxPlayers = 2,
  gameSize = 8,
  players = [],
  turn = 0;

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  let command = msg.toString().split(' ');
  switch (command[0]) {
    case 'connect':
      connectPlayer(rinfo, command[1]);
      break;
    case Commands.MOVE:
      turnResolve(command[1], parseInt(command[2]), parseInt(command[3]));
      break;
  }
});

server.on('error', err => {
  console.log(`server error:\n${err.stack}`);
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

server.bind(41234);
// server listening 0.0.0.0:41234

function connectPlayer(rinfo, name) {
  if (players.length < maxPlayers) {
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
      }
      // send info for player who have turn
      sendTurn();
    }
  } else {
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
    //for each player send info about game, board size and player names
    server.send(
      Buffer.from(`${Commands.MOVE} ${name} ${x} ${y}`),
      player.port,
      player.address,
      err => {}
    );
  }
  turn = turn >= maxPlayers - 1 ? 0 : turn + 1;
  // send to player who have turn info about that
  sendTurn();
}

function sendTurn() {
  server.send(
    Buffer.from(Commands.YOURTURN),
    players[turn].port,
    players[turn].address,
    err => {}
  );
}
