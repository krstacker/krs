import input from "../../input.js"
import settings from "../../settings.js"
const useWorldControls = () => {
  let result = false
  if (settings.settings.rotationSystem.includes("srs") === true) {
	result = true
  }
  if (settings.settings.rotationSystem.includes("asc") === true) {
	result = true
  }
  if (settings.settings.rotationSystem === "world") {
	result = true
  }
  if (settings.settings.rotationSystem === "krsb") {
	result = true
  }
  return result
}

export default function krsSonicDrop(arg) {
  if (input.getGamePress("hardDrop")) {
    if (
		arg.piece.isLanded ||
		input.getGameDown("specialKey") ||
		useWorldControls()
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