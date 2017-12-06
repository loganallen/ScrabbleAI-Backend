var express = require('express');
var validateWordsRouter = require('./validateWords');
var validateWords = validateWordsRouter.validateWords;

/*
board[r][c] : {
  location: [r,c],
  type: boardSpaceType,
  tile: Tile,
  isSet: boolean
};

Tile: {
  letter: string,
  value: number,
  onBoard: boolean
}
*/

/*****************************************************************************
 *****************************  SLOT GENERATION  *****************************
 *****************************************************************************/

// Generates a list of all possible slots, which is a list of contiguous [r,c]
const generateSlots = (board) => {
  let slotSet = new Set();

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

  let slots = [];
  slotSet.forEach(slotString => {
    slots.push(convertToSlot(slotString));
  });

  console.log(`Generated ${slots.length} unique slots`);
  return slots;
};

 const _recGenParaHorizontalSlots = (board, _r, c, len, slots) => {
   // Return if column is outside bounds or if surpassed slot window size
   if (_r < 0 || _r > 14 || len > 7) return slots;

   // Tile is set so don't bother
   if (board[_r][c].isSet) return slots;

   // Slide slot window from left to right
   let k = len-1;
   while (k >= 0) {
     let slot = [];
     let collision = false;

     for (let j=0; j<len; j++) {
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

   return _recGenParaHorizontalSlots(board, _r, c, len+1, slots);
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

/*
 *
 * Vertical Slot Generationg Methods
 *
 */

const _recGenParaVerticalSlots = (board, r, _c, len, slots) => {
  // Return if column is outside bounds or if surpassed slot window size
  if (_c < 0 || _c > 14 || len > 7) return slots;

  // Tile is set so don't bother
  if (board[r][_c].isSet) return slots;

  // Slide slot window from top to bottom
  let k = len-1;
  while (k >= 0) {
    let slot = [];
    let collision = false;

    for (let j=0; j<len; j++) {
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

  return _recGenParaVerticalSlots(board, r, _c, len+1, slots);
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
 ************************  FIND BEST WORD PLACEMENT  *************************
 *****************************************************************************/

const findBestWordPlacement = (board, slots, hand, dictionary) => {
  // Build dictionary with hand permutations for each possible slot length
  let handPermutationDict = {};
  for (let i=1; i<=hand.length; i++) {
    handPermutationDict[i] = _handPermutations(hand, i);
  }

  slots.forEach(slot => {
    // Go through all permutations of hand tiles in this slot
    let permutations = _handPermutations(hand, slot.length);
    permutations.forEach(perm => {
      // Place tiles on board

      // Generate words and points

      // Validate words and save point total if highest seen

    })
  })
};

const _handPermutations = (hand, n) => {

};

const permute = (tiles) => {
  let len = tiles.length;
  let permutations = [tiles.slice()];
  let c = new Array(len).fill(0);
  let i = 1;

  while (i < len) {
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
  console.log('Finding best word...');
  let board = req.body.board;
  let hand = req.body.hand;
  let dictionary = req.app.get('dictionary');

  console.log('Generating slots...');
  let slots = generateSlots(board);

  console.log('Finding best word placement...');
  findBestWordPlacement(board, slots, hand, dictionary);

  res.json({
    points: 0
  });
});

module.exports = {
  router
};
