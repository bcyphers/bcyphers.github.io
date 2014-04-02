function AI(grid) {
  this.grid = grid;
  minSearchTime = 0.001;
}

// static evaluation function
AI.prototype.eval = function() {
  var emptyCells = this.grid.availableCells().length;

  var smoothWeight  = 0.1,
      monoWeight    = 1.0,
      emptyWeight   = 2.7,
      maxWeight     = 1.0,
      pairsWeight   = 4.0;

  return this.grid.smoothness() * smoothWeight
       + this.grid.monotonicity() * monoWeight
       + Math.log(emptyCells) * emptyWeight
       + this.grid.maxValue() * maxWeight;
       //+ this.grid.pairsAvailable() * pairsWeight;
};

// alpha-beta depth first search
// TODO: Remove 'cutoffs' - doesn't seem necessary
AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;

  // the maxing player
  // TODO: we should try to predict how an actual player will operate, not how the computer will.
  if (this.grid.playerTurn) {
    bestScore = alpha;

    for (var direction = 0; direction < 4; direction++) {
      var newGrid = this.grid.clone();

      if (newGrid.move(direction).moved) {
        positions++;

        if (newGrid.isWin())
          return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };

        var newAI = new AI(newGrid);

        if (depth == 0) {
          // Base case: evaluate the score after the move, and return the result.
          result = { move: direction, score: newAI.eval() };
        } else {
          // Recursive step: perform search again, with one fewer level of depth.
          result = newAI.search(depth-1, bestScore, beta, positions, cutoffs);

          if (result.score > 9900) { // we win at some point down the line
            result.score--; // slightly penalize deeper wins
          }

          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        // Update our results if we have found a new best move
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }

        // Prune a move branch
        if (bestScore > beta) {
          cutoffs++
          return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
        }
      }
    }
  } else { // computer's turn
    bestScore = beta;
    /*
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };

    for (var cell of cells) {
      for (var value in scores) {
        var tile = new Tile(cell, parseInt(value, 10));
        var newGrid = this.grid.clone()
        newGrid.insertTile(tile);
        var newAI = new AI(newGrid);

        positions++;

        if (depth == 0) {
          // Base case: evaluate the score after the move, and return the result.
          result = { move: direction, score: -1 * newAI.eval() };
        } else {
          // Recursive step: perform search again, with one fewer level of depth.
          result = newAI.search(depth-1, alpha, bestScore, positions, cutoffs);
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score < bestScore) {
          bestScore = result.score;
        }
        if (bestScore < alpha) {
          cutoffs++;
          return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
        }
      }
    }
    */
    
    // try a 2 and 4 in each cell and measure how helpful it is
    // with metrics from eval
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    var candidates = [];

    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);

        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));

        this.grid.insertTile(tile);
        scores[value][i] = this.eval();
        this.grid.removeTile(cell);
      }
    }

    // now just pick out the best moves
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    for (var value in scores) { // 2 and 4
      for (var i=0; i<scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push( { position: cells[i], value: parseInt(value, 10) } );
        }
      }
    }

    // search on each candidate
    for (var i=0; i<candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
      }
    }
  }

  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function() {
  return this.search(2, -10000, 10000, 0, 0);
  return this.iterativeDeep();
}

// performs iterative deepening over the alpha-beta search
AI.prototype.iterativeDeep = function() {
  var start = (new Date()).getTime();
  var depth = 0;
  var best;

  do {
    var newBest = this.search(depth, -10000, 10000, 0 ,0);
    console.log(newBest.score);
    best = newBest;
    depth++;
  } while ( (new Date()).getTime() - start < minSearchTime);

  return best
}

AI.prototype.translate = function(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}
