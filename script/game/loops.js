import $, {
  bpmToMs,
  framesToMs,
  resetAnimation,
  roundBpmToMs,
  roundMsToFrames,
} from "../shortcuts.js"
import {
  gravity,
  classicGravity,
  deluxeGravity,
} from "./loop-modules/gravity.js"
import { PIECE_COLORS, SOUND_SETS } from "../consts.js"
import addStaticScore from "./loop-modules/add-static-score.js"
import arcadeScore from "./loop-modules/arcade-score.js"
import collapse from "./loop-modules/collapse.js"
import firmDrop from "./loop-modules/firm-drop.js"
import tgmSoftDrop from "./loop-modules/tgm-soft-drop.js"
import krsSoftDrop from "./loop-modules/krs-soft-drop.js"
import krsHardDrop from "./loop-modules/krs-hard-drop.js"
import gameHandler from "./game-handler.js"
import handheldDasAre from "./loop-modules/handheld-das-are.js"
import hardDrop from "./loop-modules/hard-drop.js"
import hold from "./loop-modules/hold.js"
import hyperSoftDrop from "./loop-modules/hyper-soft-drop.js"
import initialDas from "./loop-modules/initial-das.js"
import initialHold from "./loop-modules/initial-hold.js"
import initialRotation from "./loop-modules/initial-rotation.js"
import linesToLevel from "./loop-modules/lines-to-level.js"
import lockFlash from "./loop-modules/lock-flash.js"
import respawnPiece from "./loop-modules/respawn-piece.js"
import rotate from "./loop-modules/rotate.js"
import rotate180 from "./loop-modules/rotate-180.js"
import shifting from "./loop-modules/shifting.js"
import shiftingRetro from "./loop-modules/shifting-retro.js"
import sonicDrop from "./loop-modules/sonic-drop.js"
import softDrop from "./loop-modules/soft-drop.js"
import softDropRetro from "./loop-modules/soft-drop-retro.js"
import softDropNes from "./loop-modules/soft-drop-nes.js"
import sound from "../sound.js"
import updateLasts from "./loop-modules/update-lasts.js"
import {
  extendedLockdown,
  retroLockdown,
  classicLockdown,
  infiniteLockdown,
  zenLockdown,
  krsLockdown,
} from "./loop-modules/lockdown.js"
import updateFallSpeed from "./loop-modules/update-fallspeed.js"
import shiftingNes from "./loop-modules/shifting-nes.js"
import nesDasAre from "./loop-modules/nes-das-are.js"
import settings from "../settings.js"
import input from "../input.js"
import locale from "../lang.js"
import rotateReverse from "./loop-modules/rotate-reverse.js"
let lastLevel = 0
let garbageTimer = 0
let shown20GMessage = false
let shownHoldWarning = false
let lastSeenI = 0
let lastBravos = 0
let lastGrade = ""
let rtaGoal = 0
let isEndRoll = false
let endRollPassed = false
let endRollLines = 0
let preEndRollLines = 0
let lastPieces = 0
let onCountdown = false
let countdownTimer = 0
let lastGemsCleared = 0
let testMode = false
let collapseUnderwater = false
let noGradeUpdate = false
const updateTestMode = () => {
	if (input.getGamePress("testModeKey")) {
		if (testMode !== false) {
			testMode = false
		} else {
			testMode = true
		}
	}
}
const updateNextAndHold = () => {
	const game = gameHandler.game
	if (game.currentEffect === "holdLock") {
		$(".hold-canvas").classList.add("disabledeffect")
		$(".hold-lock").classList.add("disabledeffect")
	} else {
		$(".hold-canvas").classList.remove("disabledeffect")
		$(".hold-lock").classList.remove("disabledeffect")
	}
	if (game.currentEffect === "hideNext") {
		$(".main-next-canvas").classList.add("hiddeneffect")
		$(".sub-next-canvas").classList.add("hiddeneffect")
		$(".hold-canvas").classList.add("hiddeneffect")
	} else {
		$(".main-next-canvas").classList.remove("hiddeneffect")
		$(".sub-next-canvas").classList.remove("hiddeneffect")
		$(".hold-canvas").classList.remove("hiddeneffect")
	}
	if (game.useEffectBlocks && game.stack.effectBlockInterval === 0 && game.pendingEffect !== "") {
		$(".hold-canvas").classList.add("oneffect")
	} else {
		$(".hold-canvas").classList.remove("oneffect")
	}
	if (
		game.currentEffect === "fadingBlock"
	) {
		$(".stack-canvas").classList.add("fadingeffect")
	} else {
		$(".stack-canvas").classList.remove("fadingeffect")
	}
	if (
		game.currentEffect === "xRay"
	) {
		$(".stack-canvas").classList.add("xrayeffect")
	} else {
		$(".stack-canvas").classList.remove("xrayeffect")
	}
	if (
		game.currentEffect === "phantomBlock" || 
		game.stack.isHidden !== false
	) {
		$(".stack-canvas").classList.add("phantomeffect")
	} else {
		$(".stack-canvas").classList.remove("phantomeffect")
	}
	if (testMode === false) {
		$(".error-stack").classList.add("nontestmode")
	} else {
		$(".error-stack").classList.remove("nontestmode")
	}
}
const updateLockDelay = (game, lockDelay) => {
	if (testMode === false) {
		game.piece.lockDelayLimit = Math.ceil(framesToMs(lockDelay))
	} else {
		game.piece.lockDelayLimit = Math.ceil(framesToMs(60))
	}
}
const resetTimeLimit = (game) => {
	game.timePassedOffset += game.timePassed
	game.timePassed = 0
	countdownTimer = 0
}
const resetTimePassed = (game) => {
	game.timePassedOffset = 0
	game.timePassed = 0
}
const updateLockFlash = () => {
	settings.settings.lockFlash = "dim"
}
const krsLevelSystem = (game, pieceRequirement = 40, levelGoal = 20) => {
	let returnValue = false
	game.stack.levelPieceRequirement = pieceRequirement
	game.stat.level = Math.floor(game.stat.piece / pieceRequirement) + 1
	if (game.stat.level !== lastLevel) {
		if (game.stat.level <= levelGoal) {
			sound.add("levelup")
			sound.add("levelupmajor")
		} else {
			game.stat.level = levelGoal
		}
		returnValue = true
	}
	lastLevel = game.stat.level
	return returnValue
}
const krsGradingSystem = (
	game, 
	gradingTable = [
		[0, "N/A"],
	],
	firstGrade = "N/A",
	applauseGrades = [],
	cheerGrades = [],
) => {
	if (noGradeUpdate) {
		return
	}
	let currentGrade = ""
	for (const pair of gradingTable) {
        const score = pair[0]
        const grade = pair[1]
        if (game.stat.score >= score) {
			currentGrade = grade
        }
    }
	game.stat.grade = currentGrade
	if (lastGrade !== game.stat.grade && game.stat.grade !== "N/A") {
		if (game.stat.grade !== firstGrade) {
			sound.add("gradeup")
		}
		if (applauseGrades.includes(game.stat.grade) !== false) {
			sound.add("applause")
		}
		if (cheerGrades.includes(game.stat.grade) !== false) {
			sound.add("cheer")
		}
	}
	lastGrade = game.stat.grade
}

const updateKrsBackgroundV1 = (game) => {
	let backgroundTable = [
		"back0",
		"back0",
		"back1",
		"back2",
		"back3",
		"back4",
		"back5",
		"back6",
		"back7",
		"back8",
		"back9",
		"back10",
		"back11",
		"back12",
		"back13",
		"back14",
		"back15",
		"back16",
		"back17",
		"back18",
		"back19",
	]
	for (const name of backgroundTable) {
		if (game.stat.level <= 15) {
			if (name === backgroundTable[game.stat.level]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		} else {
			if (name === backgroundTable[15]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		}
	}
}

const updateKrsBackgroundV2 = (game) => {
	let backgroundTable = [
		"back0",
		"back0",
		"back1",
		"back2",
		"back3",
		"back4",
		"back5",
		"back6",
		"back7",
		"back8",
		"back9",
		"back10",
		"back11",
		"back12",
		"back13",
		"back14",
		"back15",
		"back16",
		"back17",
		"back18",
		"back19",
	]
	for (const name of backgroundTable) {
		if (game.stat.level <= 20) {
			if (name === backgroundTable[game.stat.level]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		} else {
			if (name === backgroundTable[20]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		}
	}
}

const updateKrsBackgroundV3 = (game) => {
	let backgroundTable = [
		"back0",
		"back0",
		"back1",
		"back2",
		"back3",
		"back4",
		"back5",
		"back6",
		"back7",
		"back8",
		"back9",
		"back10",
		"back11",
		"back12",
		"back13",
		"back14",
		"back15",
		"back16",
		"back17",
		"back18",
		"back19",
	]
	for (const name of backgroundTable) {
		if (game.stat.level <= 20) {
			if (name === backgroundTable[game.stat.level]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		} else {
			if (name === backgroundTable[game.stat.level % 20]) {
				document.getElementById(name).style.opacity = 1
			} else {
				document.getElementById(name).style.opacity = 0
			}
		}
	}
}

export const loops = {
  normal: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV1(game)
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		if (game.playedHurryUp) {
			$("#timer").classList.remove("hurry-up")
		}
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = false
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 15
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      game.piece.gravity = Math.max((gravityEquation * 1000) / Math.max(((game.stat.level - 1) * 5), 1), framesToMs(1 / 20))
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 120],
		[2, 120],
		[3, 120],
        [4, 120],
        [5, 120],
        [6, 120],
        [7, 120],
        [8, 120],
		[9, 120],
		[10, 120],
		[11, 120],
		[12, 120],
		[13, 120],
	  ]
	  const areTable = [
		[1, 30],
		[2, 30],
		[3, 30],
        [4, 30],
        [5, 30],
        [6, 30],
        [7, 30],
        [8, 30],
		[9, 30],
		[10, 30],
		[11, 30],
		[12, 30],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [13, -4],
        [15, -4],
      ]
      const areLineTable = [
		[1, 30],
		[2, 30],
		[3, 30],
        [4, 30],
        [5, 30],
        [6, 30],
        [7, 30],
        [8, 30],
		[9, 30],
		[10, 30],
		[11, 30],
		[12, 30],
      ]
	  const lockDelayTable = [
		[10, 30],
		[11, 30],
		[12, 30],
		[13, 30],
		[14, 30],
		[15, 30],
		[16, 30],
		[17, 30],
		[18, 30],
		[19, 30],
		[20, 30],
      ]
	  const musicProgressionTable = [
        [7.8, 1],
        [8, 2],
		[15.8, 3],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["normal2"], "normal")
              sound.killBgm()
              sound.playBgm(["normal2"], "normal")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  game.piece.ghostIsVisible = false
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 120000
	  game.musicProgression = 0
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = false
    },
  },
  trial: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV1(game)
	  krsGradingSystem(
		game,
		[
			[0, "1"],
			[400*1.6, "2"],
			[800*1.6, "3"],
			[1400*1.6, "4"],
			[2000*1.6, "5"],
			[5500*1.6, "6"],
			[8000*1.6, "7"],
			[12000*1.6, "8"],
			[16000*1.6, "9"],
			[22000*1.6, "10"],
			[30000*1.6, "11"],
			[40000*1.6, "12"],
			[52000*1.6, "<bronze>BM</bronze>"],
			[66000*1.6, "<silver>SM</silver>"],
			[82000*1.6, "<gold>GM</gold>"],
			[100000*1.6, "<platinum>TM</platinum>"],
			[120000*1.6, "<diamond>KM</diamond>"],
		],
		"1",
		[
			"<bronze>BM</bronze>",
			"<silver>SM</silver>",
		],
		[
			"<gold>GM</gold>",
			"<platinum>TM</platinum>",
			"<diamond>KM</diamond>",
		]
	  )
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		$("#timer").classList.remove("hurry-up")
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = true
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 15
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      if (game.stat.level < 10) {
		  game.piece.gravity = Math.max((gravityEquation * 1000) / Math.max(((game.stat.level - 1) * 10), 1), framesToMs(1 / 20))
	  } else {
		  game.piece.gravity = framesToMs(1 / 20)
	  }
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 120],
		[2, 115],
		[3, 110],
        [4, 105],
        [5, 100],
        [6, 95],
        [7, 90],
        [8, 85],
		[9, 80],
		[10, 75],
		[11, 70],
		[12, 65],
		[13, 60],
		[14, 55],
		[15, 50],
		[16, 45],
		[17, 40],
		[18, 40],
		[19, 40],
	  ]
	  const areTable = [
		[6, 30],
		[7, 28],
		[8, 26],
        [9, 24],
        [10, 20],
        [12, 18],
        [13, 16],
        [14, 14],
		[15, 12],
		[18, 10],
		[19, 8],
		[20, 8],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [12, -6],
        [14, 0],
      ]
      const areLineTable = [
		[6, 30],
		[7, 28],
		[8, 26],
        [9, 24],
        [10, 20],
        [12, 18],
        [13, 16],
        [14, 14],
		[15, 12],
		[18, 10],
		[19, 8],
		[20, 8],
      ]
	  const lockDelayTable = [
		[10, 30],
		[11, 28],
		[12, 26],
		[13, 24],
		[14, 22],
		[15, 20],
		[16, 18],
		[17, 16],
		[18, 14],
		[19, 12],
		[20, 10],
      ]
	  const musicProgressionTable = [
		[4.8, 1],
        [5, 2],
        [9.8, 3],
		[10, 4],
		[15.8, 5],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["trial2"], "trial")
              sound.killBgm()
              sound.playBgm(["trial2"], "trial")
			  break
			case 4:
			  sound.loadBgm(["trial3"], "trial")
              sound.killBgm()
              sound.playBgm(["trial3"], "trial")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		noGradeUpdate = true
		if (game.stat.grade === "<diamond>KM</diamond>") {
			sound.add("cheer")
			game.stat.grade = "<titanium>KM+</titanium>"
		}
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  game.piece.ghostIsVisible = false
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 120000
	  game.musicProgression = 0
	  game.stat.grade = ""
	  //game.endingStats.grade = true
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
	  noGradeUpdate = false
    },
  },
  virtuoso: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV1(game)
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		$("#timer").classList.remove("hurry-up")
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  if (arg.piece.startingAre >= arg.piece.startingAreLimit) {
        garbageTimer += arg.ms
        if (garbageTimer > 10000) {
          garbageTimer -= 10000
          if (game.stat.level >= 8) {
			  arg.stack.addGarbageToCounter(1)
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = true
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 20
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      game.piece.gravity = framesToMs(1 / 20)
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 60],
		[3, 55],
		[5, 50],
		[9, 45],
		[10, 40],
		[13, 35],
		[15, 30],
	  ]
	  const areTable = [
	    [1, 20],
        [2, 18],
        [3, 16],
        [4, 14],
        [5, 12],
		[6, 10],
		[7, 10],
		[10, 10],
		[11, 10],
		[12, 8],
		[13, 8],
		[16, 6],
		[21, 6],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [12, -6],
        [14, 0],
      ]
      const areLineTable = [
        [1, 20],
        [2, 18],
        [3, 16],
        [4, 14],
        [5, 12],
		[6, 10],
		[7, 10],
		[10, 10],
		[11, 10],
		[12, 8],
		[13, 8],
		[16, 6],
		[21, 6],
      ]
	  const lockDelayTable = [
		[1, 30],
		[2, 28],
		[3, 26],
		[4, 24],
		[5, 22],
		[6, 20],
		[7, 18],
		[8, 16],
		[12, 14],
		[16, 12],
		[20, 10],
      ]
	  const musicProgressionTable = [
        [7.8, 1],
		[8, 2],
		[14.8, 3],
		[15, 4],
		[19.8, 5],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["virtuoso2"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso2"], "virtuoso")
			  break
			case 4:
			  sound.loadBgm(["virtuoso3"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso3"], "virtuoso")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  game.piece.ghostIsVisible = false
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 60000
	  game.musicProgression = 0
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
	  garbageTimer = 0
	  sound.add("cheer")
    },
  },
  normal2: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV2(game)
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		$("#timer").classList.remove("hurry-up")
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = false
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 20
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      game.piece.gravity = Math.max((gravityEquation * 1000) / Math.max(((game.stat.level - 1) * 5), 1), framesToMs(1 / 20))
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 120],
		[2, 120],
		[3, 120],
        [4, 120],
        [5, 120],
        [6, 120],
        [7, 120],
        [8, 120],
		[9, 120],
		[10, 120],
		[11, 120],
		[12, 120],
		[13, 120],
	  ]
	  const areTable = [
		[1, 30],
		[2, 30],
		[3, 30],
        [4, 30],
        [5, 30],
        [6, 30],
        [7, 30],
        [8, 30],
		[9, 30],
		[10, 30],
		[11, 30],
		[12, 30],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [13, -4],
        [15, -4],
      ]
      const areLineTable = [
		[1, 30],
		[2, 30],
		[3, 30],
        [4, 30],
        [5, 30],
        [6, 30],
        [7, 30],
        [8, 30],
		[9, 30],
		[10, 30],
		[11, 30],
		[12, 30],
      ]
	  const lockDelayTable = [
		[10, 30],
		[11, 30],
		[12, 30],
		[13, 30],
		[14, 30],
		[15, 30],
		[16, 30],
		[17, 30],
		[18, 30],
		[19, 30],
		[20, 30],
      ]
	  const musicProgressionTable = [
        [9.8, 1],
        [10, 2],
		[20.8, 3],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["normal2"], "normal")
              sound.killBgm()
              sound.playBgm(["normal2"], "normal")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  game.piece.ghostIsVisible = true
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 120000
	  game.musicProgression = 0
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = false
    },
  },
  trial2: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV2(game)
	  krsGradingSystem(
		game,
		[
			[0, "1"],
			[400*3.2, "2"],
			[800*3.2, "3"],
			[1400*3.2, "4"],
			[2000*3.2, "5"],
			[5500*3.2, "6"],
			[8000*3.2, "7"],
			[12000*3.2, "8"],
			[16000*3.2, "9"],
			[22000*3.2, "10"],
			[30000*3.2, "11"],
			[40000*3.2, "12"],
			[52000*3.2, "<bronze>BM</bronze>"],
			[66000*3.2, "<silver>SM</silver>"],
			[82000*3.2, "<gold>GM</gold>"],
			[100000*3.2, "<platinum>TM</platinum>"],
			[120000*3.2, "<diamond>KM</diamond>"],
		],
		"1",
		[
			"<bronze>BM</bronze>",
			"<silver>SM</silver>",
		],
		[
			"<gold>GM</gold>",
			"<platinum>TM</platinum>",
			"<diamond>KM</diamond>",
		]
	  )
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		$("#timer").classList.remove("hurry-up")
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = true
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 20
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      if (game.stat.level < 10) {
		  game.piece.gravity = Math.max((gravityEquation * 1000) / Math.max(((game.stat.level - 1) * 10), 1), framesToMs(1 / 20))
	  } else {
		  game.piece.gravity = framesToMs(1 / 20)
	  }
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 120],
		[2, 115],
		[3, 110],
        [4, 105],
        [5, 100],
        [6, 95],
        [7, 90],
        [8, 85],
		[9, 80],
		[10, 75],
		[11, 70],
		[12, 65],
		[13, 60],
		[14, 55],
		[15, 50],
		[16, 45],
		[17, 40],
		[18, 40],
		[19, 40],
	  ]
	  const areTable = [
		[6, 30],
		[7, 28],
		[8, 26],
        [9, 24],
        [10, 20],
        [12, 18],
        [13, 16],
        [14, 14],
		[15, 12],
		[18, 10],
		[19, 8],
		[20, 8],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [12, -6],
        [14, 0],
      ]
      const areLineTable = [
		[6, 30],
		[7, 28],
		[8, 26],
        [9, 24],
        [10, 20],
        [12, 18],
        [13, 16],
        [14, 14],
		[15, 12],
		[18, 10],
		[19, 8],
		[20, 8],
      ]
	  const lockDelayTable = [
		[10, 30],
		[11, 28],
		[12, 26],
		[13, 24],
		[14, 22],
		[15, 20],
		[16, 18],
		[17, 16],
		[18, 14],
		[19, 12],
		[20, 10],
      ]
	  const musicProgressionTable = [
		[4.8, 1],
        [5, 2],
        [9.8, 3],
		[10, 4],
		[20.8, 5],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["trial2"], "trial")
              sound.killBgm()
              sound.playBgm(["trial2"], "trial")
			  break
			case 4:
			  sound.loadBgm(["trial3"], "trial")
              sound.killBgm()
              sound.playBgm(["trial3"], "trial")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		noGradeUpdate = true
		if (game.stat.grade === "<diamond>KM</diamond>") {
			sound.add("cheer")
			game.stat.grade = "<titanium>KM+</titanium>"
		}
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  if (game.stat.level >= 2) {
		  game.piece.ghostIsVisible = false
	  } else {
		  game.piece.ghostIsVisible = true
	  }
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 120000
	  game.musicProgression = 0
	  game.stat.grade = ""
	  //game.endingStats.grade = true
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
	  noGradeUpdate = false
    },
  },
  virtuoso2: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV2(game)
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		if (game.playedHurryUp) {
			$("#timer").classList.remove("hurry-up")
		}
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  if (arg.piece.startingAre >= arg.piece.startingAreLimit) {
        garbageTimer += arg.ms
        if (garbageTimer > 10000) {
          garbageTimer -= 10000
          if (game.stat.level >= 4) {
			  arg.stack.addGarbageToCounter(1)
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = true
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 25
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      game.piece.gravity = framesToMs(1 / 20)
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
	  }
	  const timeLimitTable = [
		[1, 60],
		[3, 55],
		[5, 50],
		[9, 45],
		[10, 40],
		[13, 35],
		[15, 30],
	  ]
	  const areTable = [
        [1, 10],
        [2, 9],
        [3, 8],
        [4, 7],
		[5, 6],
		[11, 6],
		[16, 6],
		[21, 6],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [12, -6],
        [14, 0],
      ]
      const areLineTable = [
        [1, 10],
        [2, 9],
        [3, 8],
        [4, 7],
		[5, 6],
		[11, 6],
		[16, 6],
		[21, 6],
      ]
	  const lockDelayTable = [
		[1, 24],
		[2, 24],
		[3, 22],
		[4, 22],
		[5, 20],
		[6, 20],
		[7, 18],
		[8, 16],
		[12, 14],
		[16, 12],
		[20, 10],
      ]
	  const musicProgressionTable = [
        [3.8, 1],
		[4, 2],
		[11.8, 3],
		[12, 4],
		[19.8, 5],
		[20, 6],
		[25.8, 7],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
			case 7:
			  sound.killBgm()
			  break
            case 2:
			  sound.loadBgm(["virtuoso2"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso2"], "virtuoso")
			  break
			case 4:
			  sound.loadBgm(["virtuoso3"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso3"], "virtuoso")
			  break
			case 6:
			  game.useBoneBlocks = true
			  sound.loadBgm(["virtuoso4"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso4"], "virtuoso")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  game.piece.ghostIsVisible = false
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 60000
	  game.musicProgression = 0
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
	  garbageTimer = 0
	  sound.add("cheer")
	  game.useBoneBlocks = false
    },
  },
  virtuoso3: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackgroundV3(game)
      collapse(arg)
      if (arg.piece.inAre) {
        initialDas(arg)
        initialRotation(arg)
        initialHold(arg)
        arg.piece.are += arg.ms
      } else {
        respawnPiece(arg)
        rotate(arg)
        rotate180(arg)
        shifting(arg)
      }
      gravity(arg)
      krsHardDrop(arg)
	  krsSoftDrop(arg)
      krsLockdown(arg)
      if (!arg.piece.inAre) {
        hold(arg)
      }
      lockFlash(arg)
      updateLasts(arg)
	  updateLockFlash()
	  if (game.timePassed >= game.timeGoal - 10000) {
		onCountdown = true
        if (!game.playedHurryUp) {
          sound.add("hurryup")
          $("#timer").classList.add("hurry-up")
          game.playedHurryUp = true
        }
      } else {
		onCountdown = false
		$("#timer").classList.remove("hurry-up")
		game.playedHurryUp = false
      }
	  if (game.piece.startingAre >= game.piece.startingAreLimit) {
        countdownTimer += arg.ms
        if (countdownTimer > 1000) {
          countdownTimer -= 1000
          if (onCountdown) {
			  sound.add("countdown")
		  }
        }
      }
	  if (arg.piece.startingAre >= arg.piece.startingAreLimit) {
        garbageTimer += arg.ms
        if (garbageTimer > 10000) {
          garbageTimer -= 10000
          if (game.stat.level <= 7) {
			  arg.stack.addGarbageToCounter(1)
		  }
        }
      }
	  updateNextAndHold()
	  updateTestMode()
	  game.useEffectBlocks = true
      /* Might use this code later
      $('#das').max = arg.piece.dasLimit;
      $('#das').value = arg.piece.das;
      $('#das').style.setProperty('--opacity', ((arg.piece.arr >= arg.piece.arrLimit) || arg.piece.inAre) ? 1 : 0);
      */
    },
    onPieceSpawn: (game) => {
	  const pieceRequirement = 40
	  const levelGoal = 40
      const x = game.stat.level
      const gravityEquation = (0.8 - (x - 1) * 0.007) ** (x - 1)
      game.piece.gravity = framesToMs(1 / 20)
      updateFallSpeed(game)
      if (krsLevelSystem(game, pieceRequirement, levelGoal)) {
		resetTimeLimit(game)
		if (collapseUnderwater) {
			game.stack.clearUnderwaterRows()
		}
	  }
	  const timeLimitTable = [
		[1, 60],
		[3, 55],
		[5, 50],
		[9, 45],
		[10, 40],
		[13, 40],
		[15, 35],
		[17, 35],
		[19, 30],
		[20, 60],
		[21, 55],
		[23, 50],
		[25, 45],
		[27, 40],
		[28, 45],
		[34, 45],
		[39, 45],
		[40, 45],
	  ]
	  const areTable = [
		[7, 10],
        [9, 10],
        [11, 9],
        [15, 8],
        [17, 7],
        [19, 6],
		[27, 12],
		[40, 12],
      ]
      const areLineModifierTable = [
        [7, -4],
        [15, -6],
        [27, 0],
      ]
      const areLineTable = [
        [7, 8],
        [9, 8],
        [11, 7],
        [15, 6],
        [17, 5],
        [19, 5],
		[27, 5],
		[40, 5],
      ]
      const lockDelayTable = [
        [1, 20],
		[2, 18],
		[3, 16],
		[4, 14],
		[5, 12],
		[7, 12],
		[8, 18],
		[11, 18],
		[12, 16],
		[15, 16],
		[16, 14],
        [19, 14],
		[20, 24],
		[21, 22],
		[22, 20],
		[23, 18],
		[24, 16],
		[25, 14],
        [26, 12],
		[27, 10],
        [28, 20],
		[29, 18],
		[30, 16],
		[31, 14],
		[32, 12],
		[33, 10],
		[34, 10],
		[39, 10],
		[40, 10],
      ]
	  const musicProgressionTable = [
	    [3.8, 1],
		[4, 2],
        [6.8, 3],
		[8, 4],
		[13.8, 5],
		[14, 6],
		[19.8, 7],
		[20, 8],
		[27.8, 9],
		[28, 10],
		[34, 11],
		[40.8, 12],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
			case 7:
			  sound.killBgm()
			  break
			case 9:
			  sound.killBgm()
			  break
			case 11:
			  game.next.nextLimit = 1
			  break
			case 12:
			  sound.killBgm()
			  break
			case 2:
			  collapseUnderwater = false
			  sound.loadBgm(["virtuoso3"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso3"], "virtuoso")
			  break
            case 4:
			  collapseUnderwater = false
			  sound.loadBgm(["virtuoso5"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso5"], "virtuoso")
			  break
			case 6:
			  collapseUnderwater = true
			  sound.loadBgm(["virtuoso6"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso6"], "virtuoso")
			  break
			case 8:
			  collapseUnderwater = false
			  game.next.nextLimit = 1
			  sound.loadBgm(["virtuoso1"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso1"], "virtuoso")
			  break
			case 10:
			  collapseUnderwater = false
			  game.next.nextLimit = 2
			  game.stack.isFrozen = true
			  sound.loadBgm(["virtuoso7"], "virtuoso")
              sound.killBgm()
              sound.playBgm(["virtuoso7"], "virtuoso")
			  break
          }
          game.musicProgression = entry
        }
      }
	  for (const pair of timeLimitTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.timeGoal = entry * 1000
          break
        }
      }
	  for (const pair of areTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of areLineModifierTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLimitLineModifier = framesToMs(entry)
          break
        }
      }
      for (const pair of areLineTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          game.piece.areLineLimit = framesToMs(entry)
          break
        }
      }
	  for (const pair of lockDelayTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level <= level) {
          updateLockDelay(game, entry)
          break
        }
      }
	  if (game.stat.piece >= pieceRequirement * levelGoal) {
		game.stat.piece = pieceRequirement * levelGoal
		$("#kill-message").textContent = locale.getString("ui", "excellent")
        sound.killVox()
        sound.add("voxexcellent")
        game.end(true)
	  }
	  let underwaterTable = [
	    [1, false],
		[2, false],
		[3, false],
		[4, false],
		[5, false],
		[6, false],
		[7, false],
		[8, true],
		[9, false],
		[10, true],
		[11, false],
		[12, true],
		[13, false],
		[14, true],
		[15, true],
		[16, true],
		[17, true],
		[18, true],
		[19, true],
		[20, true],
		[21, true],
		[22, true],
		[23, true],
		[24, false],
	  ]
	  for (const pair of underwaterTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.level === level) {
		  game.stack.removeEffectBlocks()
          game.stack.isUnderwater = entry
          break
        }
      }
	  game.piece.ghostIsVisible = false
    },
    onInit: (game) => {
      game.lineGoal = null
      game.stat.level = 1
      lastLevel = 1
      game.piece.gravity = 1000
      updateFallSpeed(game)
      game.updateStats()
	  game.isRaceMode = true
	  resetTimePassed(game)
	  game.timeGoal = 60000
	  game.musicProgression = 0
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
	  game.stack.isUnderwater = false
	  game.stack.isFrozen = false
	  collapseUnderwater = false
	  game.next.nextLimit = 3
	  garbageTimer = 0
	  sound.add("cheer")
    },
  },
}