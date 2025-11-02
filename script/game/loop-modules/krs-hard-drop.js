import input from "../../input.js"
import settings from "../../settings.js"

export default function krsSonicDrop(arg) {
  if (input.getGamePress("hardDrop")) {
    if (
		arg.piece.isLanded ||
		input.getGameDown("specialKey") ||
		settings.settings.rotationSystem.includes("srs") ||
		settings.settings.rotationSystem === "world" ||
		settings.settings.rotationSystem === "krsb"
	) {
		arg.piece.hardDrop()
	} else {
		arg.piece.realSonicDrop()
	}
    if (arg.piece.breakHoldingTimeOnSoftDrop) {
		arg.piece.holdingTime = arg.piece.holdingTimeLimit
    }
  }
}