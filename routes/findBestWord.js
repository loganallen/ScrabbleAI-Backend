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

/*
 *
 * Horizontal Slot Generationg Methods
 *
 */

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
 }

 const _genParallelHorizontalSlots = (board, r, c) => {
   let slotsT = _recGenParaHorizontalSlots(board, r-1, c, 1, []);
   let slotsB = _recGenParaHorizontalSlots(board, r+1, c, 1, []);

   return [
     ...slotsT,
     ...slotsB
   ];
 }

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
}

const _genPerpendicularHorizontalSlots = (board, r, c) => {
  let slotsL = _recGenPerpHorizontalSlots(board, r, c-1, [], [], true);
  let slotsR = _recGenPerpHorizontalSlots(board, r, c+1, [], [], false);

  return [
    ...slotsL,
    ...slotsR
  ];
}

const _genHorizontalSlots = (board, r, c) => {
  let perpSlots = _genPerpendicularHorizontalSlots(board, r, c);
  let paraSlots = _genParallelHorizontalSlots(board, r, c);

  return [
    ...perpSlots,
    ...paraSlots
  ];
}

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
}

const _genParallelVerticalSlots = (board, r, c) => {
  let slotsL = _recGenParaVerticalSlots(board, r, c-1, 1, []);
  let slotsR = _recGenParaVerticalSlots(board, r, c+1, 1, []);

  return [
    ...slotsL,
    ...slotsR
  ];
}

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
}

const _genPerpendicularVerticalSlots = (board, r, c) => {
  let slotsT = _recGenPerpVerticalSlots(board, r-1, c, [], [], true);
  let slotsB = _recGenPerpVerticalSlots(board, r+1, c, [], [], false);

  return [
    ...slotsT,
    ...slotsB
  ];
}

const _genVerticalSlots = (board, r, c) => {
  let perpSlots = _genPerpendicularVerticalSlots(board, r, c);
  let paraSlots = _genParallelVerticalSlots(board, r, c);

  return [
    ...perpSlots,
    ...paraSlots
  ];
}

/* Generate all possible slots */
const generateSlots = (board) => {
  let slots = [];
  board.forEach((row, r) => {
    row.forEach((space, c) => {
      if (space.isSet) {
        let slotsV = _genVerticalSlots(board, r, c);
        let slotsH = _genHorizontalSlots(board, r, c);
        slots = [
          ...slots,
          ...slotsV,
          ...slotsH
        ];
      }
    });
  });

  return slots;
}

var router = express.Router();

/* POST best word placement on board. */
router.post('/', function(req, res, next) {
  console.log('Finding best word...');
  let board = req.body.board;
  let hand = req.body.hand;
  let dictionary = req.app.get('dictionary');

  let slots = generateSlots(board);
  console.log(slots.length);

  res.json({
    points: 0
  });
});

module.exports = {
  router
};
