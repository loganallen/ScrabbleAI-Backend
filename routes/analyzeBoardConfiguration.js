var express = require('express');
var utils = require('../utils');

const BoardSpaceTypes = utils.BoardSpaceTypes;
const BINGO_BONUS = utils.BINGO_BONUS;

const getRowsAndColumns = (board) => {
  let rows = new Set();
  let cols = new Set();

  board.forEach((row, r) => {
    row.forEach((space, c) => {
      if (space.tile && !space.isSet) {
        rows.add(r);
        cols.add(c);
      }
    });
  });

  const sort = (a, b) => (a - b);

  return [
    [...rows].sort(sort),
    [...cols].sort(sort)
  ];
};

// Extract the tile value and bonus for this space
const _extractTileValueAndBonus = (space) => {
  let value = 0;
  let bonus = [];
  if (space.isSet) {
    value = space.tile.value;
  } else {
    switch (space.type) {
      case BoardSpaceTypes.DOUBLE_LETTER:
        value = space.tile.value * 2;
        break;
      case BoardSpaceTypes.TRIPLE_LETTER:
        value = space.tile.value * 3;
        break;
      case BoardSpaceTypes.DOUBLE_WORD:
      case BoardSpaceTypes.TRIPLE_WORD:
        bonus.push(space.type);
        value = space.tile.value;
        break;
      default:
        value = space.tile.value;
    }
  }

  return [value, bonus];
};

// Recursively builds horizontal word with points and keeps track of word bonuses
const _recHorizontalSearch = (board, _r, c, expandLeft) => {
  // Return if out of bounds
  if (c < 0 || c > 14) return ['', 0, []];

  // Return if space has no tile
  let space = board[_r][c];
  if (!space.tile) return ['', 0, []];

  // Get the proper value of the tile
  let [value, bonus] = _extractTileValueAndBonus(space);

  // Recusively expand horizontally
  let word = '';
  if (expandLeft) {
    let [lWord, lVal, lBonus] = _recHorizontalSearch(board, _r, c-1, expandLeft);
    word = lWord + space.tile.letter;
    value += lVal;
    bonus = [...bonus, ...lBonus];
  } else {
    let [rWord, rVal, rBonus] = _recHorizontalSearch(board, _r, c+1, expandLeft);
    word = space.tile.letter + rWord;
    value += rVal;
    bonus = [...bonus, ...rBonus];
  }

  return [word, value, bonus];
};

// Horizontal word search
const _horizontalSearch = (board, _r, c) => {
  let [lWord, lVal, lBonus] = _recHorizontalSearch(board, _r, c, true);
  let [rWord, rVal, rBonus] = _recHorizontalSearch(board, _r, c+1, false);

  let word = lWord + rWord;
  let points = 0;
  // One letter words don't count
  if (word.length > 1) {
    points = lVal + rVal;
  }

  lBonus.concat(rBonus).forEach(bonus => {
    if (bonus === BoardSpaceTypes.DOUBLE_WORD) { points *= 2; }
    else if (bonus === BoardSpaceTypes.TRIPLE_WORD) { points *= 3; }
  });

  return [word, points];
};

// Recursively builds vertical word with points and keeps track of word bonuses
const _recVerticalSearch = (board, r, _c, expandUp) => {
  // Return if out of bounds
  if (r < 0 || r > 14) return ['', 0, []];

  // Return if space has no tile
  let space = board[r][_c];
  if (!space.tile) return ['', 0, []];

  // Get the proper value of the tile
  let [value, bonus] = _extractTileValueAndBonus(space);

  // Recusively expand horizontally
  let word = '';
  if (expandUp) {
    let [tWord, tVal, tBonus] = _recVerticalSearch(board, r-1, _c, expandUp);
    word = tWord + space.tile.letter;
    value += tVal;
    bonus = [...bonus, ...tBonus];
  } else {
    let [bWord, bVal, bBonus] = _recVerticalSearch(board, r+1, _c, expandUp);
    word = space.tile.letter + bWord;
    value += bVal;
    bonus = [...bonus, ...bBonus];
  }

  return [word, value, bonus];
};

// Vertical word search
const _verticalSearch = (board, r, _c) => {
  let [tWord, tVal, tBonus] = _recVerticalSearch(board, r, _c, true);
  let [bWord, bVal, bBonus] = _recVerticalSearch(board, r+1, _c, false);

  let word = tWord + bWord;
  let points = 0;
  // One letter words don't count
  if (word.length > 1) {
    points = tVal + bVal;
  }

  tBonus.concat(bBonus).forEach(bonus => {
    if (bonus === BoardSpaceTypes.DOUBLE_WORD) { points *= 2; }
    else if (bonus === BoardSpaceTypes.TRIPLE_WORD) { points *= 3; }
  });

  return [word, points];
};

// Generate new words on board and the total points
const analyzeBoardConfiguration = (board, numTilesPlayed) => {
  // console.log('Generating words and points...');
  let [rows, cols] = getRowsAndColumns(board);
  let words = [];
  let totalPoints = 0;

  if (rows.length === 1) {
    // One horizontal search
    let [word, points] = _horizontalSearch(board, rows[0], cols[0]);
    words.push(word);
    totalPoints += points;

    // cols.length many vertical searches
    cols.forEach(c => {
      let [word, points] = _verticalSearch(board, rows[0], c);
      words.push(word);
      totalPoints += points;
    });
  } else {
    // One vertical search
    let [word, points] = _verticalSearch(board, rows[0], cols[0]);
    words.push(word);
    totalPoints += points;

    // rows.length many horizontal searches
    rows.forEach(r => {
      let [word, points] = _horizontalSearch(board, r, cols[0]);
      words.push(word);
      totalPoints += points;
    });
  }

  // Add bingo bonus points for clearing out the hand
  totalPoints += (numTilesPlayed === 7) ? BINGO_BONUS : 0;

  // Filter out one letter words
  words = words.filter(word => word.length > 1);
  return [words, totalPoints];
};

/*****************************************************************************
 *****************************  ROUTER METHODS  ******************************
 *****************************************************************************/

var router = express.Router();

const _getNumTilesOnBoard = (hand) => {
  return hand.reduce((acc, tile) => acc + Number(tile.onBoard), 0);
};

/* POST analyze board configuration and return. */
router.post('/', function(req, res, next) {
  let board = req.body.board;
  let hand = req.body.hand;

  let numTilesPlayed = _getNumTilesOnBoard(hand);
  let [words, points] = analyzeBoardConfiguration(board, numTilesPlayed);

  res.json({
    words: words,
    points: points
  });
});

module.exports = {
  router,
  getRowsAndColumns,
  analyzeBoardConfiguration
};
