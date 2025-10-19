import input from "../../input.js"

export default function rotate(arg) {
  if (arg.currentEffect === "rotateLock") {
	return
  }
  const piece = arg.piece
  if (input.getGamePress("rotateLeft")) {
    piece.rotateLeft()
  }
  if (input.getGamePress("rotateRight")) {
    piece.rotateRight()
  }
}
