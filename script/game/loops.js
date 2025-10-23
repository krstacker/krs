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
let levelTimer = 0
let levelTimerLimit = 58000
let lastPieces = 0
let onCountdown = false
let countdownTimer = 0
let lastGemsCleared = 0
let testMode = false
let collapseUnderwater = false
let medals = [
	"(KH)", //Home runs
	"(KT)", //T spins
	"(KL)", //L spins
	"(KJ)", //J spins
	"(KS)", //S spins
	"(KZ)", //Z spins
	"(KI)", //I spins
	"(KC)", //O spins
	"(KB)", //Perfect clears
	"(KR)", //Combos
	"(KV)", //Clutches
]
let bpm
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
		$(".hold-canvas").classList.add("hidden")
		$(".hold-label").classList.add("disabledeffect")
	} else {
		$(".hold-canvas").classList.remove("hidden")
		$(".hold-label").classList.remove("disabledeffect")
	}
	if (game.currentEffect === "hideNext") {
		$(".main-next-canvas").classList.add("hidden")
		$(".sub-next-canvas").classList.add("hidden")
		$(".next-label").classList.add("disabledeffect")
	} else {
		$(".main-next-canvas").classList.remove("hidden")
		$(".sub-next-canvas").classList.remove("hidden")
		$(".next-label").classList.remove("disabledeffect")
	}
	if (game.useEffectBlocks && game.stack.effectBlockInterval === 0 && game.pendingEffect !== "") {
		$(".hold-canvas").classList.add("oneffect")
	} else {
		$(".hold-canvas").classList.remove("oneffect")
	}
	if (
		game.currentEffect === "fadingBlock" ||
		game.currentEffect === "phantomBlock" || 
		game.stack.isHidden !== false
	) {
		$(".stack-canvas").classList.add("fadingeffect")
	} else {
		$(".stack-canvas").classList.remove("fadingeffect")
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
		if (applauseGrades.includes(game.stat.grade) {
			sound.add("applause")
		}
		if (cheerGrades.includes(game.stat.grade) {
			sound.add("cheer")
		}
	}
	lastGrade = game.stat.grade
}

const updateKrsBackground = (game) => {
	let backgroundTable = [
		"backmenu",
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

export const loops = {
  normal: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackground(game)
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
        [6.8, 1],
        [7, 2],
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
	  updateKrsBackground(game)
	  krsGradingSystem(
		game,
		[
			[0, "1"],
			[400*2.5, "2"],
			[800*2.5, "3"],
			[1400*2.5, "4"],
			[2000*2.5, "5"],
			[5500*2.5, "6"],
			[8000*2.5, "7"],
			[12000*2.5, "8"],
			[16000*2.5, "9"],
			[22000*2.5, "10"],
			[30000*2.5, "11"],
			[40000*2.5, "12"],
			[52000*2.5, "BRONZE"],
			[66000*2.5, "SILVER"],
			[82000*2.5, "GOLD"],
			[100000*2.5, "PLATINUM"],
			[120000*2.5, "DIAMOND"],
			[150000*2.5, "TITANIUM"],
		],
		"1",
		[
			"BRONZE",
			"SILVER",
		],
		[
			"GOLD",
			"PLATINUM",
			"DIAMOND",
			"TITANIUM",
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
		[18, 35],
		[19, 30],
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
		[21, 8],
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
		[21, 8],
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
	  game.endingStats.grade = true
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
    },
  },
  virtuoso: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackground(game)
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
          if (game.stat.level >= 15) {
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
	    [1, 24],
        [2, 22],
        [3, 20],
        [4, 18],
        [5, 16],
		[6, 14],
		[7, 12],
		[11, 10],
		[16, 8],
		[21, 6],
      ]
	  const areLineModifierTable = [
        [10, -4],
        [12, -6],
        [14, 0],
      ]
      const areLineTable = [
        [1, 24],
        [2, 22],
        [3, 20],
        [4, 18],
        [5, 16],
		[6, 14],
		[7, 12],
		[11, 10],
		[16, 8],
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
        [9.8, 1],
		[10, 2],
		[20.8, 2],
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
			  sound.loadBgm(["stage2"], "virtuoso1")
              sound.killBgm()
              sound.playBgm(["stage2"], "virtuoso1")
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
	  updateKrsBackground(game)
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
	  updateKrsBackground(game)
	  krsGradingSystem(
		game,
		[
			[0, "1"],
			[400*3.5, "2"],
			[800*3.5, "3"],
			[1400*3.5, "4"],
			[2000*3.5, "5"],
			[5500*3.5, "6"],
			[8000*3.5, "7"],
			[12000*3.5, "8"],
			[16000*3.5, "9"],
			[22000*3.5, "10"],
			[30000*3.5, "11"],
			[40000*3.5, "12"],
			[52000*3.5, "BRONZE"],
			[66000*3.5, "SILVER"],
			[82000*3.5, "GOLD"],
			[100000*3.5, "PLATINUM"],
			[120000*3.5, "DIAMOND"],
			[150000*3.5, "TITANIUM"],
		],
		"1",
		[
			"BRONZE",
			"SILVER",
		],
		[
			"GOLD",
			"PLATINUM",
			"DIAMOND",
			"TITANIUM",
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
		[18, 35],
		[19, 30],
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
		[21, 8],
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
		[21, 8],
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
	  game.endingStats.grade = true
	  updateLockFlash()
	  onCountdown = false
	  countdownTimer = 0
	  game.useEffectBlocks = true
	  game.stat.effect = ""
    },
  },
  virtuoso2: {
    update: (arg) => {
	  const game = gameHandler.game
	  updateKrsBackground(game)
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
          if (game.stat.level >= 5) {
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
	  const levelGoal = 30
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
		[11, 10],
		[16, 8],
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
		[11, 10],
		[16, 8],
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
        [9.8, 1],
		[10, 2],
		[19.8, 3],
		[20, 4],
		[30.8, 5],
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
			  sound.loadBgm(["stage2"], "virtuoso1")
              sound.killBgm()
              sound.playBgm(["stage2"], "virtuoso1")
			  break
			case 4:
			  game.useBoneBlocks = true
			  sound.loadBgm(["stage3"], "virtuoso1")
              sound.killBgm()
              sound.playBgm(["stage3"], "virtuoso1")
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
	  updateKrsBackground(game)
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
          if (game.stat.level >= 2 && game.stat.level <= 7) {
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
	  }
	  const timeLimitTable = [
		[1, 60],
		[3, 55],
		[5, 50],
		[9, 45],
		[10, 40],
		[13, 35],
		[15, 30],
		[23, 30],
		[24, 60],
		[26, 55],
		[28, 50],
		[30, 45],
		[31, 40],
		[32, 35],
		[33, 30],
	  ]
	  const areTable = [
		[7, 12],
        [9, 10],
        [11, 9],
        [15, 8],
        [19, 7],
        [23, 6],
		[31, 12],
		[40, 12],
      ]
      const areLineModifierTable = [
        [7, -4],
        [15, -6],
        [31, 0],
      ]
      const areLineTable = [
        [7, 8],
        [9, 8],
        [11, 7],
        [15, 6],
        [19, 5],
        [23, 5],
		[31, 5],
		[40, 5],
      ]
      const lockDelayTable = [
        [1, 20],
		[2, 18],
		[3, 16],
		[4, 14],
		[6, 14],
		[7, 12],
		[8, 18],
		[9, 16],
		[10, 14],
        [23, 14],
		[24, 20],
		[25, 18],
		[26, 16],
		[27, 14],
		[28, 12],
		[29, 10],
        [30, 10],
		[31, 10],
        [32, 20],
		[33, 18],
		[34, 16],
		[35, 14],
		[36, 12],
		[37, 10],
		[38, 10],
		[39, 10],
		[40, 10],
      ]
	  const musicProgressionTable = [
        [7.8, 1],
		[8, 2],
		[15.8, 3],
		[16, 4],
		[23.8, 5],
		[24, 6],
		[31.8, 7],
		[32, 8],
		[40.8, 9],
      ]
	  for (const pair of musicProgressionTable) {
        const level = pair[0]
        const entry = pair[1]
        if (game.stat.piece >= Math.floor((level - 1) * pieceRequirement) && game.musicProgression < entry) {
          switch (entry) {
            case 1:
			  sound.killBgm()
			  break
			case 2:
			  sound.killBgm()
			  break
			case 3:
			  sound.killBgm()
			  break
			case 4:
			  sound.killBgm()
			  break
			case 5:
			  sound.killBgm()
			  break
			case 6:
			  sound.killBgm()
			  break
			case 7:
			  sound.killBgm()
			  break
			case 8:
			  sound.killBgm()
			  break
			case 9:
			  sound.killBgm()
			  break
            case 2:
			  collapseUnderwater = false
			  sound.loadBgm(["stage2"], "virtuoso2")
              sound.killBgm()
              sound.playBgm(["stage2"], "virtuoso2")
			  break
			case 4:
			  collapseUnderwater = true
			  sound.loadBgm(["stage3"], "virtuoso2")
              sound.killBgm()
              sound.playBgm(["stage3"], "virtuoso2")
			case 6:
			  game.next.nextLimit = 1
			  sound.loadBgm(["stage4"], "virtuoso2")
              sound.killBgm()
              sound.playBgm(["stage4"], "virtuoso2")
			case 8:
			  game.next.nextLimit = 2
			  game.stack.isFrozen = true
			  sound.loadBgm(["stage5"], "virtuoso2")
              sound.killBgm()
              sound.playBgm(["stage5"], "virtuoso2")
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
		[15, false],
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