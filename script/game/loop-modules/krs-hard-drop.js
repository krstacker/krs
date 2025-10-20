import input from "../../input.js"

export default function krsSonicDrop(arg) {
  if (input.getGamePress("hardDrop")) {
    if (arg.piece.isLanded || input.getGameDown("specialKey")) {
		arg.piece.hardDrop()
	} else {
		arg.piece.realSonicDrop()
	}
    if (arg.piece.breakHoldingTimeOnSoftDrop) {
		arg.piece.holdingTime = arg.piece.holdingTimeLimit
    }
  }
}