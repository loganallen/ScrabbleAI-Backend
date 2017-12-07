var express = require('express');
var abcRouter = require('./analyzeBoardConfiguration');

var getRowsAndColumns = abcRouter.getRowsAndColumns;

const _isAdjacentToSetTile = (board, r, c) => {
  let valid = false;
  if (r > 0) { valid = valid || board[r-1][c].isSet; }
  if (r < 14) { valid = valid || board[r+1][c].isSet; }
  if (c > 0) { valid = valid || board[r][c-1].isSet; }
  if (c < 14) { valid = valid || board[r][c+1].isSet; }

  return valid;
}

// Validate tile placement on board
const validateTilePlacement = (board, firstTurn) => {
  let [rows, cols] = getRowsAndColumns(board);

  if (firstTurn) {
    // Fail if no tile in starting space for the first turn
    if (!board[7][7].tile) {
      throw new Error('Word must pass through starting space');
    } else if (rows.length === 1 && cols.length === 1) {
      throw new Error('Word must be longer than 1 letter');
    }
  } else {
    // Fail if tiles don't touch any already set tiles
    let valid = false;
    rows.forEach(r => {
      cols.forEach(c => {
        valid = valid || _isAdjacentToSetTile(board, r, c);
      });
    });
    if (!valid) {
      throw new Error('Word must be adjacent to set tiles');
    }
  }

  // Fail if tiles not all in same row or column
  if (rows.length > 1 && cols.length > 1) {
    throw new Error('Invalid tile placements');
  }

  // Fail if tiles don't make contiguous word
  if (rows.length === 1) {
    for (let c=cols[0]; c<=cols[cols.length-1]; c++) {
      if (!board[rows[0]][c].tile) {
        throw new Error('Invalid tile placements');
      }
    }
  } else {
    for (let r=rows[0]; r<=rows[rows.length-1]; r++) {
      if (!board[r][cols[0]].tile) {
        throw new Error('Invalid tile placements');
      }
    }
  }

  return true;
}

var router = express.Router();

/* POST validate tile placement on board */
router.post('/', function(req, res, next) {
  let board = req.body.board;
  let firstTurn = req.body.firstTurn;

  try {
    let valid = validateTilePlacement(board, firstTurn);
    res.json({
      valid: valid
    });
  } catch (e) {
    res.json({
      valid: false,
      error: e.message
    });
  }
});

module.exports = {
  router
};
