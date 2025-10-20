import input from "../../input.js"
import sound from "../../sound.js"
import { framesToMs } from "../../shortcuts.js"
import settings from "../settings.js"

export default function krsFirmDrop(arg, frameGravity = 1) {
  if (settings.settings.pieceBehavior === "krs" || settings.settings.pieceBehavior === "tgm2") {
  if (arg.piece.gravity < framesToMs(1) && arg.piece.isLanded) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
		if (arg.piece.mustLock === false) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
		arg.piece.hasHardDropped = true
        arg.piece.mustLock = true
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
		if (arg.piece.mustLock === false) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
		arg.piece.hasHardDropped = true
        arg.piece.mustLock = true
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
  }
  if (settings.settings.pieceBehavior === "ace" || settings.settings.pieceBehavior === "ds") {
  if (arg.piece.gravity < framesToMs(1) && arg.piece.isLanded) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
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
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
  }
  if (settings.settings.pieceBehavior === "tgm4") {
  if (input.getGameDown("specialKey")) {
  if (arg.piece.gravity < framesToMs(1) && arg.piece.isLanded) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
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
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
  } else {
if (arg.piece.gravity < framesToMs(1) && arg.piece.isLanded) {
    if (input.getGamePress("softDrop")) {
      arg.piece.gravityMultiplier = Math.max(
        1,
        arg.piece.gravity / framesToMs(frameGravity)
      )
      if (!arg.piece.isLanded) {
        arg.piece.genPieceParticles()
      } else {
		if (arg.piece.mustLock === false) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
		arg.piece.hasHardDropped = true
        arg.piece.mustLock = true
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
		if (arg.piece.mustLock === false) {
			arg.piece.mustLock = true
			arg.piece.hasHardDropped = true
			sound.add("harddrop")
		}
		arg.piece.hasHardDropped = true
        arg.piece.mustLock = true
      }
    } else {
      arg.piece.gravityMultiplier = 1
    }
  }
  }
  }
}
