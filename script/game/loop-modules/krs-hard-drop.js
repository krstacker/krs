import input from "../../input.js"
import settings from "../settings.js"

export default function krsSonicDrop(arg) {
	if (settings.settings.pieceBehavior === "krs") {
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
	if (settings.settings.pieceBehavior === "tgm2") {
		if (input.getGamePress("hardDrop")) {
			arg.piece.realSonicDrop()
			if (arg.piece.breakHoldingTimeOnSoftDrop) {
				arg.piece.holdingTime = arg.piece.holdingTimeLimit
			}
		}
	}
	if (settings.settings.pieceBehavior === "ace" || settings.settings.pieceBehavior === "ds") {
		if (input.getGamePress("hardDrop")) {
			arg.piece.hardDrop()
			if (arg.piece.breakHoldingTimeOnSoftDrop) {
				arg.piece.holdingTime = arg.piece.holdingTimeLimit
			}
		}
	}
	if (settings.settings.pieceBehavior === "tgm4") {
		if (input.getGamePress("hardDrop")) {
			if (input.getGameDown("specialKey")) {
				arg.piece.hardDrop()
			} else {
				arg.piece.realSonicDrop()
			}
			if (arg.piece.breakHoldingTimeOnSoftDrop) {
				arg.piece.holdingTime = arg.piece.holdingTimeLimit
			}
		}
	}
}