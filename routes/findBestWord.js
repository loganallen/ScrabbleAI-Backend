var express = require('express');
var vwRouter = require('./validateWords');
var abcRouter = require('./analyzeBoardConfiguration');
var utils = require('../utils');

var validateWords = vwRouter.validateWords;
var analyzeBoardConfiguration = abcRouter.analyzeBoardConfiguration;
var getRowsAndColumns = abcRouter.getRowsAndColumns;
var cloneBoard = utils.cloneBoard;
var specialLetters = utils.specialLetters;
var DictionaryLevel = utils.DictionaryLevel;

const EFFICIENCY_THRESHOLD = utils.EFFICIENCY_THRESHOLD;
const SPECIAL_EFFICIENCY_THRESHOLD = utils.SPECIAL_EFFICIENCY_THRESHOLD;

/*****************************************************************************
 *****************************  SLOT GENERATION  *****************************
 *****************************************************************************/

// Generates a list of all possible slots, which is a list of contiguous [r,c]
const generateSlots = (board, firstTurn) => {
  let slotSet = new Set();

  if (firstTurn) {
    // Generate slots going through [7,7]
    let [r, c, minLen] = [7, 7, 2];
    let slotsV = _recGenParaVerticalSlots(board, 7, 7, 2, []);
    let slotsH = _recGenParaHorizontalSlots(board, r, c, 2, []);
    slotsV.forEach(slot => slotSet.add(convertFromSlot(slot)));
    slotsH.forEach(slot => slotSet.add(convertFromSlot(slot)));
  } else {
    // Generate all possible slots touching each set tile
    board.forEach((row, r) => {
      row.forEach((space, c) => {
        if (space.isSet) {
          let slotsV = _genVerticalSlots(board, r, c);
          let slotsH = _genHorizontalSlots(board, r, c);
          slotsV.forEach(slot => slotSet.add(convertFromSlot(slot)));
          slotsH.forEach(slot => slotSet.add(convertFromSlot(slot)));
        }
      });
    });
  }

  let slots = [...slotSet].map(slotString =>
    convertToSlot(slotString)
  ).sort((a, b) => (a.length - b.length));

  return slots;
};

 const _recGenParaHorizontalSlots = (board, _r, c, size, slots) => {
   // Return if column is outside bounds or if surpassed slot window size
   if (_r < 0 || _r > 14 || size > 7) return slots;

   // Tile is set so don't bother
   if (board[_r][c].isSet) return slots;

   // Slide slot window from left to right
   let k = size-1;
   while (k >= 0) {
     let slot = [];
     let collision = false;

     for (let j=0; j<size; j++) {
       let c2 = c-k+j;
       if (c2 < 0 || c2 > 14) {
         collision = true; break;
       }
       let space = board[_r][c2];
       if (space.isSet) {
         collision = true; break;
       } else {
         slot.push(space.location);
       }
     }

     if (!collision) slots.push(slot);
     k -= 1;
   }

   return _recGenParaHorizontalSlots(board, _r, c, size+1, slots);
 };

 const _genParallelHorizontalSlots = (board, r, c) => {
   let slotsT = _recGenParaHorizontalSlots(board, r-1, c, 1, []);
   let slotsB = _recGenParaHorizontalSlots(board, r+1, c, 1, []);

   return [
     ...slotsT,
     ...slotsB
   ];
 };

const _recGenPerpHorizontalSlots = (board, _r, c, slot, slots, expandLeft) => {
  // Return slot if out of bounds
  if (c < 0 || c > 14) return slots;

  // Return if slot is length 7 or hit an already set tile
  let space = board[_r][c];
  if (slot.length === 7 || space.isSet) return slots;

  if (expandLeft) {
    slot.unshift(space.location);
    c -= 1;
  } else {
    slot.push(space.location);
    c += 1;
  }

  // Add newly generated slot to slots accumulator
  slots.push([...slot]);
  return _recGenPerpHorizontalSlots(board, _r, c, slot, slots, expandLeft);
};

const _genPerpendicularHorizontalSlots = (board, r, c) => {
  let slotsL = _recGenPerpHorizontalSlots(board, r, c-1, [], [], true);
  let slotsR = _recGenPerpHorizontalSlots(board, r, c+1, [], [], false);

  return [
    ...slotsL,
    ...slotsR
  ];
};

const _genHorizontalSlots = (board, r, c) => {
  let perpSlots = _genPerpendicularHorizontalSlots(board, r, c);
  let paraSlots = _genParallelHorizontalSlots(board, r, c);

  return [
    ...perpSlots,
    ...paraSlots
  ];
};

/*****************************************************************************
 ************************  VERTICAL SLOT GENERATION  *************************
 *****************************************************************************/

const _recGenParaVerticalSlots = (board, r, _c, size, slots) => {
  // Return if column is outside bounds or if surpassed slot window size
  if (_c < 0 || _c > 14 || size > 7) return slots;

  // Tile is set so don't bother
  if (board[r][_c].isSet) return slots;

  // Slide slot window from top to bottom
  let k = size-1;
  while (k >= 0) {
    let slot = [];
    let collision = false;

    for (let j=0; j<size; j++) {
      let r2 = r-k+j;
      if (r2 < 0 | r2 > 14) {
        collision = true; break;
      }
      let space = board[r2][_c];
      if (space.isSet) {
        collision = true; break;
      } else {
        slot.push(space.location);
      }
    }

    if (!collision) slots.push(slot);
    k -= 1;
  }

  return _recGenParaVerticalSlots(board, r, _c, size+1, slots);
};

const _genParallelVerticalSlots = (board, r, c) => {
  let slotsL = _recGenParaVerticalSlots(board, r, c-1, 1, []);
  let slotsR = _recGenParaVerticalSlots(board, r, c+1, 1, []);

  return [
    ...slotsL,
    ...slotsR
  ];
};

const _recGenPerpVerticalSlots = (board, r, _c, slot, slots, expandUp) => {
  // Return slot if out of bounds
  if (r < 0 || r > 14) return slots;

  // Return if slot is length 7 or hit an already set tile
  let space = board[r][_c];
  if (slot.length === 7 || space.isSet) return slots;

  if (expandUp) {
    slot.unshift(space.location);
    r -= 1;
  } else {
    slot.push(space.location);
    r += 1;
  }

  // Add newly expanded slot to slots accumulator
  slots.push([...slot]);
  return _recGenPerpVerticalSlots(board, r, _c, slot, slots, expandUp);
};

const _genPerpendicularVerticalSlots = (board, r, c) => {
  let slotsT = _recGenPerpVerticalSlots(board, r-1, c, [], [], true);
  let slotsB = _recGenPerpVerticalSlots(board, r+1, c, [], [], false);

  return [
    ...slotsT,
    ...slotsB
  ];
};

const _genVerticalSlots = (board, r, c) => {
  let perpSlots = _genPerpendicularVerticalSlots(board, r, c);
  let paraSlots = _genParallelVerticalSlots(board, r, c);

  return [
    ...perpSlots,
    ...paraSlots
  ];
};

/*****************************************************************************
 ****************************  TILE PERMUTATIONS  ****************************
 *****************************************************************************/

const _getPermutations = (hand) => {
  let tileCombinations = _getCombinations(hand);

  let handPermutationsDict = {};
  tileCombinations.forEach(comb => {
    let permutations = _permute(comb);
    let size = comb.length;
    if (!(size in handPermutationsDict)) {
      handPermutationsDict[size] = [];
    }
    handPermutationsDict[size] = handPermutationsDict[size].concat(permutations);
  });

  return handPermutationsDict;
};

const _getCombinations = (hand) => {
  if (hand.length === 1) return [hand];

  let sub = _getCombinations(hand.slice(1));
  return sub.concat(sub.map(e => e.concat(hand[0])), [[hand[0]]]);
}

const _permute = (tiles) => {
  let size = tiles.length;
  let permutations = [tiles.slice()];
  let c = new Array(size).fill(0);
  let i = 1;

  while (i < size) {
    if (c[i] < i) {
      let k = i % 2 && c[i];
      let temp = tiles[i];
      tiles[i] = tiles[k];
      tiles[k] = temp;
      ++c[i];
      i = 1;
      permutations.push(tiles.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }

  return permutations;
};

const _convertPermToWord = (perm) => {
  return perm.reduce((acc, tile) => acc + tile.letter, '');
};

/*****************************************************************************
 ************************  FIND BEST WORD PLACEMENT  *************************
 *****************************************************************************/

const findBestWordPlacement = (board, slots, hand, dictionary, isGreedy, level) => {
  var dictionary = dictionary[level.toUpperCase()];

  // Build dictionary with hand permutations for each possible slot length
  console.log('Getting hand permutations...');
  let permutationsDict = _getPermutations(hand);
  console.log('DONE: Got all hand permutations');

  let bestBoard = [];
  let bestPerm = [];
  let bestRatio = [-1, -1];
  let bestPoints = [0, 0];
  let bestWords = [];

  console.log(`Placing tiles in slots...`);
  slots.forEach((slot, idx) => {
    // console.log(`Slot ${idx+1}`);
    // Skip slot if longer than hand length
    if (slot.length > hand.length) return;

    // Go through all permutations of hand tiles in this slot
    let permutations = permutationsDict[slot.length];
    let tempBoard = cloneBoard(board);

    permutations.forEach(perm => {
      // Skip permutation if longer than 1 letter and is not a valid word
      if (perm.length > 1) {
        let [valid, _] = validateWords(dictionary, [_convertPermToWord(perm)]);
        if (!valid) return;
      }

      // Place tiles on temp board
      slot.forEach(([r,c], idx) => {
        tempBoard[r][c].tile = perm[idx];
      });

      // Generate board words and points and validate those words
      let [words, points] = analyzeBoardConfiguration(tempBoard, perm.length);
      [valid, _] = validateWords(dictionary, words);

      // If valid, save board configuration using efficiency
      // ratio and board points
      if (valid) {
        let idx;
        if (isGreedy || level === DictionaryLevel.BEGINNER) {
          if (points > bestPoints[0]) {
            bestBoard[0] = cloneBoard(tempBoard);
            bestPerm[0] = perm;
            bestPoints[0] = points;
            bestWords[0] = words;
            bestRatio[0] = -1;
          }
        } else {
          let ratio = _getEfficiencyRatio(perm, points);
          let special = _containsSpecialLetters(perm);

          // Heuristic checks on point ratios
          if (ratio >= EFFICIENCY_THRESHOLD || (special && ratio >= SPECIAL_EFFICIENCY_THRESHOLD)) {
            if (points > bestPoints[0]) idx = 0;
          } else {
            if (ratio === 0) {
              // Don't use special letters on weak start
              if (points > bestPoints[1] && !special) idx = 1;
            } else if (ratio > bestRatio[1] && !special) {
              idx = 1;
            }
          }

          // Update best temporary variables if applicable
          if (idx != null) {
            bestBoard[idx] = cloneBoard(tempBoard);
            bestPerm[idx] = perm;
            bestPoints[idx] = points;
            bestWords[idx] = words;
            bestRatio[idx] = ratio ? ratio : 0;
          }
        }
      }

    });
  });

  // Return original board and hand if not valid moves available
  if (bestWords.length === 0) return [board, [], 0, hand];

  let idx = bestPoints[0] > 0 ? 0 : 1;
  if (isGreedy) console.log('GREEDY');
  console.log(`** [${bestWords[idx]}] | ${bestPoints[idx]} points | ratio: ${bestRatio[idx]}`);

  return [
    bestBoard[idx],
    bestWords[idx],
    bestPoints[idx],
    _updateHand(hand, bestPerm[idx])
  ];
};

const _updateHand = (hand, bestPerm) => {
  bestPerm.forEach(item => {
    for (let idx in hand) {
      let tile = hand[idx];
      if (tile.letter === item.letter) {
        tile.onBoard = true;
        break;
      }
    }
  });

  return hand;
}

const _getEfficiencyRatio = (tiles, points) => {
  let faceValue = tiles.reduce((acc, tile) => acc + tile.value, 0);
  return 1 - (faceValue / points);
};

const _containsSpecialLetters = (perm) => {
  let specialLetters = perm.reduce((acc, tile) => {
    return acc || (tile.value >= 8);
  }, false);
  return specialLetters;
};

/*****************************************************************************
 *****************************  ROUTER METHODS  ******************************
 *****************************************************************************/

/* Array prototype methods to convert from a slot array */
const convertFromSlot = (slot) => (
  slot.map(x => x.join('_')).join(',')
);

/* String prototype method to convert to a slot array */
const convertToSlot = (slotString) => (
  slotString.split(',').map(x => x.split('_').map(Number))
);

var router = express.Router();

/* POST best word placement on board. */
router.post('/', function(req, res, next) {
  let board = req.body.board;
  let hand = req.body.hand;
  let firstTurn = req.body.firstTurn;
  let isGreedy = req.body.isGreedy;
  let level = req.body.level;
  let dictionary = req.app.get('dictionary');

  if (hand.length < 1) {
    console.log('Empty hand');
    res.json({
      board: board,
      points: 0,
      hand: hand
    });
    return;
  }

  console.log('Generating slots...');
  let slots = generateSlots(board, firstTurn);
  console.log(`DONE: Generated ${slots.length} unique slots`);

  console.log('Finding best word placement...');
  let [newBoard, words, points, newHand] = findBestWordPlacement(
    board, slots, hand, dictionary, isGreedy, level
  );
  console.log('DONE: Found best word placement');

  res.json({
    board: newBoard,
    words: words,
    points: points,
    hand: newHand
  });
});

module.exports = {
  router
};
