import Tile from './Tile.jsx';

export default function GameBoard({ board, merged, spawned, moveCount }) {
  const isMerged = (r, c) => merged.some(([mr, mc]) => mr === r && mc === c);
  return (
    <div className="board" role="grid" aria-label="Game board">
      {board.map((row, r) => row.map((v, c) => (
        <div className="cell" role="gridcell" key={`${r}-${c}`}>
          {v > 0 && (
            <Tile
              key={`${moveCount}-${v}`}
              value={v}
              pop={isMerged(r, c)}
              spawn={!!spawned && spawned[0] === r && spawned[1] === c}
            />
          )}
        </div>
      )))}
    </div>
  );
}
