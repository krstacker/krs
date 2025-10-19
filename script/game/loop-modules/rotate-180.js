import input from "../../input.js"

export default function rotate180(arg) {
  if (arg.currentEffect === "rotateLock") {
	return
  }
  const piece = arg.piece
  if (input.getGamePress("rotate180")) {
    piece.rotate180()
  }
}
