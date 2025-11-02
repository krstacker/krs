import input from "../../input.js"
import sound from "../../sound.js"
import { framesToMs } from "../../shortcuts.js"
import settings from "../../settings.js"

export default function krsSoftDrop(arg, frameGravity = 1) {
  if (arg.piece.gravity < framesToMs(1) && arg.piece.isLanded &&
		settings.settings.rotationSystem.includes("srs") !== true &&
		settings.settings.rotationSystem !== "world" &&
		settings.settings.rotationSystem !== "krsb"
	) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
		if (
			arg.piece.mustLock === false
		) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  } else {
    if (input.getGameDown("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
		if (
			arg.piece.mustLock === false &&
			settings.settings.rotationSystem.includes("srs") !== true &&
			settings.settings.rotationSystem !== "world" &&
			settings.settings.rotationSystem !== "krsb"
		) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		} else if (input.getGamePress("softDrop")) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
}
