class Game {
  constructor(size = 10) {
    this.size = size;
    this.map_ = new Array(size).fill('0').map(v => {
      return new Array(size).fill('0').map(v => {
        return {
          playerName: null,
          points: 0
        };
      });
    });
  }
  add(playerName, x, y) {
    if (this.canMove(playerName, x, y)) {
      this.recursivePoints(x, y, playerName);
      return true;
    } else {
      return false;
    }
  }
  addPlayers(players) {
    if (players.length >= 1)
      this.map_[0][0] = {
        playerName: players[0],
        points: 1
      };
    if (players.length >= 2)
      this.map_[0][this.size - 1] = {
        playerName: players[1],
        points: 2
      };
    if (players.length >= 3)
      this.map_[this.size - 1][0] = {
        playerName: players[2],
        points: 3
      };
    if (players.length >= 4)
      this.map_[this.size - 1][this.size - 1] = {
        playerName: players[3],
        points: 4
      };
  }
  canMove(playerName, x, y) {
    return this.map_[y][x].playerName === playerName;
  }
  recursivePoints(x, y, playerName) {
    this.map_[y][x].points++;
    this.map_[y][x].playerName = playerName;
    if (this.map_[y][x].points === 4) {
      this.map_[y][x].points = 1;
      this.map_[y][x].playerName = playerName;

      if (y - 1 >= 0) this.recursivePoints(x, y - 1, playerName);
      if (x - 1 >= 0) this.recursivePoints(x - 1, y, playerName);
      if (y + 1 <= this.size - 1) this.recursivePoints(x, y + 1, playerName);
      if (x + 1 <= this.size - 1) this.recursivePoints(x + 1, y, playerName);
    }
  }
  toBoard() {
    return this.map_.map(v => v.map(v => v.points));
  }
}
module.exports = Game;
