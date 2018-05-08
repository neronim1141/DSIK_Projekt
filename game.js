class Game {
  constructor(size = 10) {
    this.size = size;
    let x = -1;
    let y = -1;
    this.map_ = new Array(size).fill("0").map(v => {
      y++;

      let mapX = new Array(size).fill("0").map(v => {
        x++;
        return {
          playerName: null,
          points: 0,
          x: x,
          y: y
        };
      });
      x = -1;
      return mapX;
    });
  }
  add(playerName, x, y) {
    //check if player can move
    if (this.canMove(playerName, x, y)) {
      //and add points
      let queue = [];

      queue.push(this.map_[y][x]);
      while (queue.length) {
        let item = queue.shift();

        if (this.addPoint(playerName, item.x, item.y)) {
          // test for left tile
          if (item.y - 1 >= 0) {
            queue.push(this.map_[item.y - 1][item.x]);
          }
          // test for down tile
          if (item.x - 1 >= 0) {
            queue.push(this.map_[item.y][item.x - 1]);
          }
          // test for right tile
          if (item.y + 1 <= this.size - 1) {
            queue.push(this.map_[item.y + 1][item.x]);
          }
          // test for up tile
          if (item.x + 1 <= this.size - 1) {
            queue.push(this.map_[item.y][item.x + 1]);
          }
        }
      }
    }
  }
  //init players position in game
  addPlayers(players) {
    if (players.length >= 1)
      this.map_[0][0] = {
        playerName: players[0],
        points: 3,
        x: 0,
        y: 0
      };
    if (players.length >= 2)
      this.map_[0][this.size - 1] = {
        playerName: players[1],
        points: 3,
        x: this.size - 1,
        y: 0
      };
    if (players.length >= 3)
      this.map_[this.size - 1][0] = {
        playerName: players[2],
        points: 3,
        x: 0,
        y: this.size - 1
      };
    if (players.length >= 4)
      this.map_[this.size - 1][this.size - 1] = {
        playerName: players[3],
        points: 3,
        x: this.size - 1,
        y: this.size - 1
      };
  }
  addPoint(playerName, x, y) {
    this.map_[y][x].points++;
    this.map_[y][x].playerName = playerName;
    let explode = this.map_[y][x].points >= 4;
    if (explode) {
      this.map_[y][x].points = this.map_[y][x].points - 4;
      if (this.map_[y][x].points == 0) this.map_[y][x].playerName = null;
    }
    return explode;
  }

  canMove(playerName, x, y) {
    if (x < map_.length && y < map_.length)
      return this.map_[y][x].playerName === playerName;
    else return false;
  }

  //return mat2 of only points
  toBoard() {
    return this.map_.map(v => v.map(v => v.points));
  }
  toFullBoard() {
    return this.map_;
  }

  playersOnBoard() {
    let players = [];
    for (let y = 0; y < this.map_.length; y++) {
      for (let x = 0; x < this.map_.length; x++) {
        if (this.map_[y][x].playerName == null) continue;
        if (players.indexOf(this.map_[y][x].playerName) < 0)
          players.push(this.map_[y][x].playerName);
      }
    }
    return players;
  }
}
module.exports = Game;
