var keyMirror = require('keymirror');

const EFFICIENCY_RATIO = 0.65;
const SPECIAL_EFFICIENCY_RATIO = 0.5;
const BINGO_BONUS = 50;

const BoardSpaceTypes = keyMirror({
  'START': null,
  'DEFAULT': null,
  'DOUBLE_WORD': null,
  'TRIPLE_WORD': null,
  'DOUBLE_LETTER': null,
  'TRIPLE_LETTER': null
});

const letterPointsDict = {
  1: [['E',12], ['A',9], ['I',9], ['O',8], ['N',6], ['R',6], ['T',6], ['L',4], ['S',4], ['U',4]],
  2: [['D',4], ['G',3]],
  3: [['B',2], ['C',2], ['M',2], ['P',2]],
  4: [['F',2], ['H',2], ['V',2], ['W',2], ['Y',2]],
  5: [['K',1]],
  8: [['J',1], ['X',1]],
  10: [['Q',1], ['Z',1]]
};

const cloneBoard = (board) => {
  return board.map(row => row.map(space => ( {...space} )));
};

module.exports = {
  BoardSpaceTypes,
  cloneBoard,
  EFFICIENCY_RATIO,
  SPECIAL_EFFICIENCY_RATIO,
  BINGO_BONUS
};
