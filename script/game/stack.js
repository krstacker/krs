import GameModule from "./game-module.js"
import $, { negativeMod, resetAnimation, hsvToRgb } from "../shortcuts.js"
import sound from "../sound.js"
import locale from "../lang.js"
import settings from "../settings.js"
import { SCORE_TABLES } from "../consts.js"
export default class Stack extends GameModule {
  constructor(parent, ctx) {
    super(parent)
    this.width = this.parent.settings.width
    this.height = this.parent.settings.height
    this.hiddenHeight = this.parent.settings.hiddenHeight
    this.flashX = []
    this.flashY = []
    this.flashTime = 0
    this.flashLimit = 400
    this.new()
    this.toCollapse = []
    this.ctx = ctx
    this.lineClear = 0
    this.flashLineClear = false
    this.flashClearRate = 50
    this.fadeLineClear = true
    this.useMinoSkin = false
    this.dirtyCells = []
    this.levelUpAnimation = 0
    this.levelUpAnimationLimit = 0
    this.flashOnTetris = false
    this.alarmIsOn = false
    this.isInvisible = false
    this.waitingGarbage = 0
    this.garbageSwitchRate = 1
    this.garbageHoleUsed = 0
    this.garbageRandomHole = 0
    this.antiGarbageBuffer = 0
    this.copyBottomForGarbage = false
    this.isClutch = false
	this.isHidden = false
	this.isUnderwater = false
	this.cleanUnderwaterRows = false
	this.isFrozen = false
	this.refreezeOnEffect = false
	this.isFading = false
	this.toCollapseUnderwater = []
	this.redrawOnHidden = false
	this.underwaterHeight = (this.height / 2)
	this.gemsCleared = 0
	this.effectBlockInterval = 16
	this.displayedEffectText = false
	this.targetColor = "red"
	this.lastEffect = ""
	this.erase4Gauge = 0
	this.spinGauge = 0
	this.clutchGauge = 0
	this.dangerGauge = 0
	this.b2bGauge = 0
	this.bravoGauge = 0
	this.renGauge = 0
	this.sectionGauge = 0
	this.levelGauge = 1
	this.levelPieceRequirement = 40
	$("#message").classList.remove("effectactivated")
  }
  sleep(t=1) {
	  let SAB = new SharedArrayBuffer(4);
	  let AB = new Int32Array(SAB);
	  Atomics.wait(AB, 0, 0, Math.max(1, t|0));
  }
  removeFromArray(array, elementToRemove) {
	  const indexToRemove = array.indexOf(elementToRemove)
	  if (indexToRemove > -1) {
		  array.splice(indexToRemove, 1)
	  }
	  return array
  }
  arrayContains(array, elementToFind) {
	  let result = false
	  if (array.includes(elementToFind) !== false || array.indexOf(elementToFind) > -1) {
		  result = true
	  } else {
		  result = false
	  }
	  return result
  }
  makeAllDirty() {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        this.dirtyCells.push([x, y])
      }
    }
  }
  reRenderStack() {
	this.makeAllDirty()
	this.isDirty = true
  }
  freezePlacedMinos() {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (this.parent.effectsRoster.includes(this.grid[x][y]) !== true) {
				this.grid[x][y] = "frozen"
			}
		}
      }
    }
	this.reRenderStack()
  }
  noFrozenMinos() {
	let result = true
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] === "frozen") {
			result = false
		}
      }
    }
	return result
  }
  gemIfyPlacedMinos() {
	let color = this.targetColor
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (this.parent.effectsRoster.includes(this.grid[x][y]) === true || this.grid[x][y] === "gold") {
				this.grid[x][y] = "goldgem"
			} else if (this.grid[x][y] === "frozen") {
				this.grid[x][y] = "icegem"
			} else if (this.grid[x][y] === color) {
				this.grid[x][y] = `${color}gem`
			}
		}
      }
    }
	this.reRenderStack()
  }
  hidePlacedMinos() {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
		if (this.parent.effectsRoster.includes(this.grid[x][y]) !== true && this.grid[x][y] !== "gold") {
			if (this.grid[x][y] != null) {
				this.grid[x][y] = "hidden"
			}
		}
      }
    }
	this.reRenderStack()
  }
  laserGrid() {
	this.parent.onEffectTimeout = true
	let delayFinished = false
	this.sleep(250)
	let targetColumn = Math.max(
		0,
		Math.floor(Math.random() * this.width) - 1
	)
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (x === targetColumn) {
				delete this.grid[x][y]
			}
		}
      }
    }
	sound.add("erase1")
	this.reRenderStack()
	// Laser animation
	let cellSize = this.parent.cellSize
    let buffer = this.parent.bufferPeek
    let ctx = this.ctx
	this.parent.particle.generateIgnoreSettings({
		red: 255,
		blue: 128,
		green: 128,
		amount: 1500,
		x: targetColumn * cellSize,
		y: 0,
		xRange: cellSize,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	delayFinished = true
	this.sleep(250)
	delayFinished = true
	this.reRenderStack()
	this.parent.onEffectTimeout = false
  }
  mirrorGrid() {
	this.parent.onEffectTimeout = true
	let delayFinished = false
	this.sleep(250)
	let tempGrid = this.grid
	this.new()
	for (let x = 0; x < this.grid.length; x++) {
		this.grid[x] = tempGrid[Math.max(
			0,
			(this.grid.length - 1) - x
		)]
    }
	// Grid particles
	let cellSize = this.parent.cellSize
	this.parent.particle.generateIgnoreSettings({
		red: 255,
		blue: 128,
		green: 128,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 128,
		blue: 255,
		green: 128,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 128,
		blue: 128,
		green: 255,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 255,
		blue: 255,
		green: 128,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 128,
		blue: 255,
		green: 255,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 255,
		blue: 128,
		green: 255,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.parent.particle.generateIgnoreSettings({
		red: 255,
		blue: 128,
		green: 195,
		amount: 200,
		x: 0,
		y: 0,
		xRange: cellSize * this.width,
		yRange: cellSize * (this.height + this.hiddenHeight),
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.reRenderStack()
	delayFinished = true
	this.sleep(250)
	delayFinished = true
	this.reRenderStack()
	this.parent.onEffectTimeout = false
  }
  flipGrid() {
	this.parent.onEffectTimeout = true
	let delayFinished = false
	this.sleep(250)
	let tempGrid = this.grid
	this.new()
	let flippedGrid = this.grid
	for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        flippedGrid[x][y] = tempGrid[x][Math.max(
			0,
			this.grid[x].length - y
		)]
      }
    }
	//Were not done yet. We still have to move the stack to the bottom of the board.
	tempGrid = flippedGrid
	this.new()
	let highestPoint = 0
	let lowestPoint = this.height + this.hiddenHeight - 1
	for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (tempGrid[x][y] != null) {
			if (y > highestPoint) {
				highestPoint = y
			}
		}
      }
    }
	for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        this.grid[x][y] = tempGrid[x][Math.max(
			0,
			Math.min(
				this.grid[x].length - 1,
				y - (lowestPoint - highestPoint)
			)
		)]
      }
    }
	//Grid particles
	this.parent.particle.generate({
      amount: 100,
      x: 0,
      y: this.height + this.hiddenHeight,
      xRange: this.width * this.parent.cellSize,
      yRange: this.parent.cellSize * (this.height + this.hiddenHeight),
      xVelocity: 0,
      yVelocity: 1,
      xVariance: 5,
      yVariance: 2,
      gravity: 0.3,
      gravityAccceleration: 1.05,
      lifeVariance: 80,
    })
	sound.add("collapse")
	sound.add("collapse4")
	this.reRenderStack()
	delayFinished = true
	this.sleep(250)
	delayFinished = true
	this.reRenderStack()
	this.parent.onEffectTimeout = false
  }
  sliceGridTop() {
	this.parent.onEffectTimeout = true
	let delayFinished = false
	this.sleep(250)
	let targetPoint = (this.height + this.hiddenHeight) - 4
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (y < targetPoint) {
				delete this.grid[x][y]
			}
		}
      }
    }
	this.reRenderStack()
	// Animation
	let cellSize = this.parent.cellSize
    let buffer = this.parent.bufferPeek
    let ctx = this.ctx
	this.parent.particle.generateIgnoreSettings({
		red: 128,
		blue: 255,
		green: 128,
		amount: 750,
		x: cellSize,
		y: cellSize * this.hiddenHeight,
		xRange: cellSize * this.width,
		yRange: cellSize * targetPoint,
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	this.reRenderStack()
	delayFinished = true
	this.sleep(250)
	delayFinished = true
	this.reRenderStack()
	this.parent.onEffectTimeout = false
  }
  sliceGridBottom() {
	this.parent.onEffectTimeout = true
	let delayFinished = false
	this.sleep(250)
	let targetPoint = (this.height + this.hiddenHeight) - 4
	if (this.isFrozen) {
		targetPoint = (this.height + this.hiddenHeight) - (this.height - 4)
	}
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (y >= targetPoint) {
				delete this.grid[x][y]
			}
		}
      }
    }
	this.reRenderStack()
	// Animation
	let cellSize = this.parent.cellSize
    let buffer = this.parent.bufferPeek
    let ctx = this.ctx
	this.parent.particle.generateIgnoreSettings({
		red: 128,
		blue: 255,
		green: 128,
		amount: 750,
		x: cellSize,
		y: cellSize * targetPoint,
		xRange: cellSize * this.width,
		yRange: cellSize * targetPoint,
		xVelocity: 0,
		yVelocity: 0,
		xVariance: 10,
		yVariance: 10,
		xDampening: 1,
		yDampening: 1,
		lifeVariance: 0,
    })
	delayFinished = true
	this.sleep(250)
	//Were not done yet. We still have to move the stack to the bottom of the board.
	let tempGrid = this.grid
	this.new()
	let highestPoint = 0
	let lowestPoint = this.height + this.hiddenHeight - 1
	for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (tempGrid[x][y] != null) {
			if (y > highestPoint) {
				highestPoint = y
			}
		}
      }
    }
	for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        this.grid[x][y] = tempGrid[x][Math.max(
			0,
			Math.min(
				this.grid[x].length - 1,
				y - (lowestPoint - highestPoint)
			)
		)]
      }
    }
	//Grid particles
	this.parent.particle.generate({
      amount: 100,
      x: 0,
      y: this.height + this.hiddenHeight,
      xRange: this.width * this.parent.cellSize,
      yRange: this.parent.cellSize * (this.height + this.hiddenHeight),
      xVelocity: 0,
      yVelocity: 1,
      xVariance: 5,
      yVariance: 2,
      gravity: 0.3,
      gravityAccceleration: 1.05,
      lifeVariance: 80,
    })
	sound.add("collapse")
	sound.add("collapse4")
	this.reRenderStack()
	delayFinished = true
	this.reRenderStack()
	this.parent.onEffectTimeout = false
  }
  updateMedals() {
	  let newMedals = this.parent.stat.medals
	  if (this.erase4Gauge >= 12) {
		  newMedals = newMedals.replace(`<gold> SK </gold>`, `<platinum> SK </platinum>`)
	  } else if (this.erase4Gauge >= 9) {
		  newMedals = newMedals.replace(`<silver> SK </silver>`, `<gold> SK </gold>`)
	  } else if (this.erase4Gauge >= 6) {
		  newMedals = newMedals.replace(`<bronze> SK </bronze>`, `<silver> SK </silver>`)
	  } else if (this.erase4Gauge >= 3) {
		  newMedals = newMedals.replace(`<invisible> SK </invisible>`, `<bronze> SK </bronze>`)
	  }
	  if (this.spinGauge >= 12) {
		  newMedals = newMedals.replace(`<gold> SP </gold>`, `<platinum> SP </platinum>`)
	  } else if (this.spinGauge >= 9) {
		  newMedals = newMedals.replace(`<silver> SP </silver>`, `<gold> SP </gold>`)
	  } else if (this.spinGauge >= 6) {
		  newMedals = newMedals.replace(`<bronze> SP </bronze>`, `<silver> SP </silver>`)
	  } else if (this.spinGauge >= 3) {
		  newMedals = newMedals.replace(`<invisible> SP </invisible>`, `<bronze> SP </bronze>`)
	  }
	  if (this.b2bGauge >= 12) {
		  newMedals = newMedals.replace(`<gold> BT </gold>`, `<platinum> BT </platinum>`)
	  } else if (this.b2bGauge >= 9) {
		  newMedals = newMedals.replace(`<silver> BT </silver>`, `<gold> BT </gold>`)
	  } else if (this.b2bGauge >= 6) {
		  newMedals = newMedals.replace(`<bronze> BT </bronze>`, `<silver> BT </silver>`)
	  } else if (this.b2bGauge >= 3) {
		  newMedals = newMedals.replace(`<invisible> BT </invisible>`, `<bronze> BT </bronze>`)
	  }
	  if (this.sectionGauge >= 4) {
		  newMedals = newMedals.replace(`<gold> ST </gold>`, `<platinum> ST </platinum>`)
	  } else if (this.sectionGauge >= 3) {
		  newMedals = newMedals.replace(`<silver> ST </silver>`, `<gold> ST </gold>`)
	  } else if (this.sectionGauge >= 2) {
		  newMedals = newMedals.replace(`<bronze> ST </bronze>`, `<silver> ST </silver>`)
	  } else if (this.sectionGauge >= 1) {
		  newMedals = newMedals.replace(`<invisible> ST </invisible>`, `<bronze> ST </bronze>`)
	  }
	  if (this.bravoGauge >= 4) {
		  newMedals = newMedals.replace(`<gold> BR </gold>`, `<platinum> BR </platinum>`)
	  } else if (this.bravoGauge >= 3) {
		  newMedals = newMedals.replace(`<silver> BR </silver>`, `<gold> BR </gold>`)
	  } else if (this.bravoGauge >= 2) {
		  newMedals = newMedals.replace(`<bronze> BR </bronze>`, `<silver> BR </silver>`)
	  } else if (this.bravoGauge >= 1) {
		  newMedals = newMedals.replace(`<invisible> BR </invisible>`, `<bronze> BR </bronze>`)
	  }
	  if (this.renGauge >= 4) {
		  newMedals = newMedals.replace(`<gold> RC </gold>`, `<platinum> RC </platinum>`)
	  } else if (this.renGauge >= 3) {
		  newMedals = newMedals.replace(`<silver> RC </silver>`, `<gold> RC </gold>`)
	  } else if (this.renGauge >= 2) {
		  newMedals = newMedals.replace(`<bronze> RC </bronze>`, `<silver> RC </silver>`)
	  } else if (this.renGauge >= 1) {
		  newMedals = newMedals.replace(`<invisible> RC </invisible>`, `<bronze> RC </bronze>`)
	  }
	  if (this.clutchGauge >= 4) {
		  newMedals = newMedals.replace(`<gold> CL </gold>`, `<platinum> CL </platinum>`)
	  } else if (this.clutchGauge >= 3) {
		  newMedals = newMedals.replace(`<silver> CL </silver>`, `<gold> CL </gold>`)
	  } else if (this.clutchGauge >= 2) {
		  newMedals = newMedals.replace(`<bronze> CL </bronze>`, `<silver> CL </silver>`)
	  } else if (this.clutchGauge >= 1) {
		  newMedals = newMedals.replace(`<invisible> CL </invisible>`, `<bronze> CL </bronze>`)
	  }
	  if (this.dangerGauge >= 12) {
		  newMedals = newMedals.replace(`<gold> RE </gold>`, `<platinum> RE </platinum>`)
	  } else if (this.dangerGauge >= 9) {
		  newMedals = newMedals.replace(`<silver> RE </silver>`, `<gold> RE </gold>`)
	  } else if (this.dangerGauge >= 6) {
		  newMedals = newMedals.replace(`<bronze> RE </bronze>`, `<silver> RE </silver>`)
	  } else if (this.dangerGauge >= 3) {
		  newMedals = newMedals.replace(`<invisible> RE </invisible>`, `<bronze> RE </bronze>`)
	  }
	  this.parent.stat.medals = newMedals
	  if (this.parent.stat.medals !== this.parent.lastMedals && this.parent.showMedals) {
		  sound.add("medal")
	  }
	  this.parent.lastMedals = this.parent.stat.medals
  }
  deleteCellsOfColor(color) {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (this.grid[x][y] === "color") {
				delete this.grid[x][y]
			}
		}
      }
    }
	this.reRenderStack()
  }
  removeEffectBlocks() {
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        if (this.grid[x][y] != null) {
			if (this.parent.effectsRoster.includes(this.grid[x][y])) {
				this.grid[x][y] = "gold"
			}
		}
      }
    }
	this.reRenderStack()
  }
  gridWithLockdown() {
    const finalBlocks = this.parent.piece.getFinalBlockLocations()
    const newGrid = JSON.parse(JSON.stringify(this.grid))
    for (const finalBlock of finalBlocks) {
      if (
        finalBlock[0] < 0 ||
        finalBlock[0] >= this.parent.settings.width ||
        finalBlock[1] >= this.parent.settings.height
      ) {
        console.log("Piece is too big for Matrix!!")
      } else newGrid[finalBlock[0]][finalBlock[1] + this.hiddenHeight] = "test"
    }
    return newGrid
  }
  wouldCauseLineClear() {
    const newGrid = this.gridWithLockdown()
    let lineClear = 0
	let underwaterHeightPosition = this.height + this.hiddenHeight - this.underwaterHeight
    for (let y = 0; y < newGrid[0].length; y++) {
      for (let x = 0; x <= newGrid.length; x++) {
        if (x === newGrid.length) {
		  if (this.arrayContains(this.toCollapseUnderwater, y) !== true) {
			  lineClear++
		  }
		  break
		}
        if (newGrid[x][y] == null) {
          break
        }
      }
    }
    return lineClear
  }
  add(passedX, passedY, shape, color) {
    let garbageToClear = 0
    sound.syncBgm()
    if (!this.parent.piece.hasHardDropped) {
      sound.add("locknohd")
    }
    const checkSpin = this.parent.piece.checkSpin()
    let isSpin = false
    let isMini = false
    if (
      this.parent.piece.x === this.parent.piece.rotatedX &&
      this.parent.piece.yFloor === this.parent.piece.rotatedY &&
      this.parent.piece.checkSpin().isSpin
    ) {
      isSpin = checkSpin.isSpin
      isMini = checkSpin.isMini
    }
    // isSpin = true;
    sound.add("lock")
    this.parent.shiftMatrix("down")
    this.parent.stat.piece++
    this.parent.piece.last = this.parent.piece.name
    this.lineClear = 0
    if (this.parent.hold.isLocked) {
      this.parent.hold.isLocked = false
      this.parent.hold.isDirty = true
    }
    if (
      this.parent.hold.gainHoldOnPlacement &&
      this.parent.hold.holdAmount < this.parent.hold.holdAmountLimit
    ) {
      this.parent.hold.holdAmount++
      this.parent.hold.isDirty = true
    }
    for (let i = 0; i < this.flashX.length; i++) {
      this.dirtyCells.push([this.flashX[i], this.flashY[i]])
    }
    this.flashX = []
    this.flashY = []
    this.flashTime = 0
    let passedLockOut = shape.length
	//this.targetColor = color
	if (this.isFrozen && this.wouldCauseLineClear() <= 0) {
		this.freezePlacedMinos()
	} else if (this.isHidden && this.redrawOnHidden) {
		this.reRenderStack()
	} else if (this.parent.currentEffect === "phantomBlock") {
		this.reRenderStack()
	} else if (this.isFading && this.isHidden === false) {
		this.hidePlacedMinos()
	}
	if (this.effectBlockInterval >= 16) {
		this.parent.pendingEffect = this.parent.effectsRoster[Math.max(
			0,
			Math.floor(Math.random() * this.parent.effectsRoster.length) - 1
		)]
		while (this.parent.pendingEffect === this.lastEffect) {
			this.parent.pendingEffect = this.parent.effectsRoster[Math.max(
				0,
				Math.floor(Math.random() * this.parent.effectsRoster.length) - 1
			)]
		}
	}
	if (this.isUnderwater) {
		let reRollsLeft = 3
		let underwaterEffectsRoster = [
			"rotateLock",
			"holdLock",
			"deathBlock",
			"hideNext",
			"fadingBlock",
			"phantomBlock",
		]
		if (underwaterEffectsRoster.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = underwaterEffectsRoster[Math.max(
				0,
				Math.floor(Math.random() * underwaterEffectsRoster.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = underwaterEffectsRoster[Math.max(
					0,
					Math.floor(Math.random() * underwaterEffectsRoster.length) - 1
				)]
			}
			while (
					(
						this.parent.pendingEffect === "rotateLock" || 
						this.parent.pendingEffect === "deathBlock"
					) && reRollsLeft >= 1
				) {
				//Re-rolls if it lands on rotateLock or on deathBlock to reduce the chances of getting it.
				this.parent.pendingEffect = underwaterEffectsRoster[Math.max(
					0,
					Math.floor(Math.random() * underwaterEffectsRoster.length) - 1
				)]
				while (this.parent.pendingEffect === this.lastEffect) {
					this.parent.pendingEffect = underwaterEffectsRoster[Math.max(
						0,
						Math.floor(Math.random() * underwaterEffectsRoster.length) - 1
					)]
				}
				reRollsLeft -= 1
			}
		}
	}
	if (this.isFrozen) {
		let frozenEffectsRoster = [
			"rotateLock",
			"holdLock",
			"hideNext",
			"fadingBlock",
			"phantomBlock",
			"delFieldUp",
			"delFieldDown",
			"jewelBlock",
			"deathBlock",
		]
		if (frozenEffectsRoster.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = frozenEffectsRoster[Math.max(
				0,
				Math.floor(Math.random() * frozenEffectsRoster.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = frozenEffectsRoster[Math.max(
					0,
					Math.floor(Math.random() * frozenEffectsRoster.length) - 1
				)]
			}
		}
	}
	if (this.lastEffect === "rotateLock") {
		let effectsRoster = [
			"delFieldUp",
			"delFieldDown",
		]
		if (this.isUnderwater) {
			effectsRoster = [
				"holdLock",
				"deathBlock",
				"hideNext",
				"fadingBlock",
				"phantomBlock",
			]
		}
		if (effectsRoster.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = effectsRoster[Math.max(
				0,
				Math.floor(Math.random() * effectsRoster.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = effectsRoster[Math.max(
					0,
					Math.floor(Math.random() * effectsRoster.length) - 1
				)]
			}
		}
	}
	if (this.lastEffect === "garbage") {
		let effectsRoster = [
			"delFieldUp",
			"delFieldDown",
			"fadingBlock",
			"phantomBlock",
		]
		if (effectsRoster.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = effectsRoster[Math.max(
				0,
				Math.floor(Math.random() * effectsRoster.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = effectsRoster[Math.max(
					0,
					Math.floor(Math.random() * effectsRoster.length) - 1
				)]
			}
		}
	}
	if (this.lastEffect === "jewelBlock") {
		let effectsRoster = [
			"fadingBlock",
			"phantomBlock",
		]
		if (effectsRoster.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = effectsRoster[Math.max(
				0,
				Math.floor(Math.random() * effectsRoster.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = effectsRoster[Math.max(
					0,
					Math.floor(Math.random() * effectsRoster.length) - 1
				)]
			}
		}
	}
	if (this.parent.hold.isDisabled && this.parent.pendingEffect === "holdLock") {
		let holdLockSubstitutes = [
			"rotateLock",
			"hideNext",
			"fadingBlock",
			"phantomBlock",
		]
		if (holdLockSubstitutes.includes(this.parent.pendingEffect) !== true) {
			this.parent.pendingEffect = holdLockSubstitutes[Math.max(
				0,
				Math.floor(Math.random() * holdLockSubstitutes.length) - 1
			)]
			while (this.parent.pendingEffect === this.lastEffect) {
				this.parent.pendingEffect = holdLockSubstitutes[Math.max(
					0,
					Math.floor(Math.random() * holdLockSubstitutes.length) - 1
				)]
			}
		}
	}
	if (this.parent.useEffectBlocks) {
		this.effectBlockInterval -= 1
	}
	if (
		this.parent.useEffectBlocks && 
		this.effectBlockInterval <= 0
	) {
		this.removeEffectBlocks()
	}
	let placedEffectBlock = false
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        const isFilled = shape[y][x]
        if (isFilled) {
          this.parent.particle.generate({
            amount: 5,
            x: x * this.parent.cellSize + passedX * this.parent.cellSize,
            y:
              y * this.parent.cellSize +
              passedY * this.parent.cellSize +
              this.parent.bufferPeek * this.parent.cellSize,
            xRange: this.parent.cellSize,
            yRange: this.parent.cellSize,
            xVelocity: 0,
            yVelocity: 2,
            xVariance: 4,
            yVariance: 2,
            xDampening: 1.03,
            yDampening: 1.03,
            gravity: 0,
            maxlife: 70,
            lifeVariance: 40,
          })
          const xLocation = x + passedX
          const yLocation = y + passedY + this.hiddenHeight
          if (yLocation - this.hiddenHeight >= 0) {
            passedLockOut--
          }
          if (this.parent.piece.useSpecialI && this.parent.piece.name === "I") {
            this.grid[xLocation][yLocation] = "i" + shape[y][x]
          } else {
			if (
				this.parent.useEffectBlocks &&
				this.parent.pendingEffect !== "" &&
				this.effectBlockInterval < 0
			) {
				this.grid[xLocation][yLocation] = this.parent.pendingEffect
				this.lastEffect = this.parent.pendingEffect
				if (this.parent.pendingEffect === "jewelBlock") {
					this.targetColor = color
				}
				placedEffectBlock = true
			} else if (this.isHidden && this.isFrozen !== true) {
				this.grid[xLocation][yLocation] = "hidden"
			} else if (this.parent.useBoneBlocks) {
				this.grid[xLocation][yLocation] = "bone"
			} else {
				this.grid[xLocation][yLocation] = color
			}
          }
          this.dirtyCells.push([xLocation, yLocation])
          this.flashX.unshift(xLocation)
          this.flashY.unshift(yLocation)
        }
      }
    }
	if (placedEffectBlock) {
		this.effectBlockInterval = 16
	}
    if (passedLockOut >= shape.length && settings.settings.useLockOut) {
      if (this.wouldCauseLineClear() > 0) {
        this.isClutch = true
        this.collapse()
      } else {
        $("#kill-message").textContent = locale.getString("ui", "lockOut")
        sound.killVox()
        sound.add("voxlockout")
        this.parent.end()
        return
      }
    }
	
	let playGemSound = false
	let playEffectSound = false
    for (let y = 0; y < this.grid[0].length; y++) {
      for (let x = 0; x <= this.grid.length; x++) {
        if (x === this.grid.length) {
          for (let i = 0; i < this.flashY.length; i++) {
            if (this.flashY[i] === y) {
              this.flashY.splice(i, 1)
              this.flashX.splice(i, 1)
              i--
            }
          }

		  let underwaterHeightPosition = this.height + this.hiddenHeight - this.underwaterHeight
          for (let x = 0; x < this.grid.length; x++) {
			if (this.parent.effectsRoster.includes(this.grid[x][y])) {
				playEffectSound = true
				this.parent.stat.score += (100 + (Math.min(0, this.parent.stat.level - 1) * 25))
				this.parent.timePassedOffset += 1000
				this.parent.timePassed -= 1000
				this.parent.currentEffect = this.grid[x][y]
				this.lastEffect = this.grid[x][y]
				this.effectBlockInterval = 16
			}
			if (this.grid[x][y].includes("gem")) {
				playGemSound = true
				this.gemsCleared += 1
				this.parent.timePassedOffset += 1000
				this.parent.timePassed -= 1000
				this.parent.stat.score += (100 + (Math.min(0, this.parent.stat.level - 1) * 25))
			}
			if (this.grid[x][y] === "gold") {
				this.parent.stat.score += (100 + (Math.min(0, this.parent.stat.level - 1) * 25))
				this.parent.timePassedOffset += 1000
				this.parent.timePassed -= 1000
			}
            if (this.isFrozen) {
				if (this.grid[x][y] !== "frozen") {
					delete this.grid[x][y]
				}
			} else if (this.isUnderwater) {
				if (y < underwaterHeightPosition) {
					delete this.grid[x][y]
				}
			} else {
				delete this.grid[x][y]
			}
          }
          this.parent.piece.hasLineDelay = true
          if (this.arrayContains(this.toCollapseUnderwater, y) !== true) {
			  this.lineClear++
		  }
		  if (this.isUnderwater && y >= underwaterHeightPosition) {
			  if (this.cleanUnderwaterRows) {
				  this.toCollapse.push(y)
			  } else {
				  this.toCollapseUnderwater.push(y)
			  }
		  } else {
			  this.toCollapse.push(y)
		  }
          break
        }
        if (this.grid[x][y] == null) {
          break
        }
      }
    }
	if (playGemSound) {
      sound.add("gembonus")
    }
	if (playEffectSound) {
      sound.add("effectactivated")
	  this.removeEffectBlocks()
    }
    if (isSpin) {
      sound.add("tspinbonus")
    }
	if (isSpin) {
	  this.spinGauge += 1
	}
    const version = isMini ? "mini" : ""
    if (this.lineClear >= 4 && this.flashOnTetris) {
      resetAnimation("#stack", "tetris-flash")
    }
    let pc = true
    for (let x = 0; x < this.grid.length; x++) {
      if (!pc) {
        break
      }
      for (let y = 0; y < this.grid[x].length; y++) {
        const isFilled = this.grid[x][y]
        if (isFilled) {
          pc = false
          break
        }
      }
    }
    if (this.lineClear > 0) {
      // TODO mini tspin and clean this up
      if (SCORE_TABLES[this.parent.settings.scoreTable].hasCombo) {
        this.parent.combo++
        this.parent.stat.maxcombo = Math.max(
          this.parent.combo,
          this.parent.stat.maxcombo
        )
      }
      let type = "erase"
      if (isSpin) {
        type = "tspin"
        this.parent.b2b++
        this.parent.maxb2b = Math.max(this.parent.b2b, this.parent.maxb2b)
      } else if (this.lineClear < 4) {
        this.parent.b2b = 0
      }
      if (this.lineClear < 4) {
        sound.add(`${type}not4${version}`)
      } else if (type !== "tspin") {
        this.parent.b2b++
        this.parent.maxb2b = Math.max(this.parent.b2b, this.parent.maxb2b)
      }
      const b2bPrefix = this.parent.b2b > 1 ? "b2b_" : ""
      sound.add(`${b2bPrefix}${type}${version}`)
      if (this.lineClear > 4) {
        sound.add(`${b2bPrefix}${type}4${version}`)
      } else {
        sound.add(`${b2bPrefix}${type}${this.lineClear}${version}`)
      }
      if (this.parent.b2b > 1) {
        sound.add("b2b")
      }
      if (isSpin) {
        this.parent.addScore(`tspin${this.lineClear}`)
      }
      if (!pc) {
        if (isSpin) {
          if (this.parent.b2b > 1) {
            sound.add(`voxb2b_${this.parent.piece.name.toLowerCase()}spin`)
          } else if (isMini) {
            sound.add(`voxmini${this.parent.piece.name.toLowerCase()}spin`)
          } else {
            sound.add(
              `vox${this.parent.piece.name.toLowerCase()}spin${this.lineClear}`
            )
          }
        } else {
          if (this.parent.b2b > 1 && this.lineClear === 4) {
            sound.add("voxb2b_erase4")
          } else {
            sound.add(`voxerase${this.lineClear}`)
          }
        }
      }
	  if (this.lineClear >= 4) {
		  this.erase4Gauge += 1
	  }
	  if (this.parent.b2b > 1) {
		  this.b2bGauge += 1
	  }
	  if (this.parent.combo === 5) {
		  this.renGauge += 1
	  }
	  if (this.isClutch) {
		  this.clutchGauge += 1
	  }
	  if (this.alarmIsOn) {
		  this.dangerGauge += 1
	  }
	  if (pc) {
		  this.bravoGauge += 1
	  }
	  if (this.toCollapse.length === 0) {
		this.parent.calculateActionText(
			this.lineClear,
			isSpin,
			isMini,
			this.parent.b2b,
			this.isClutch
		)
		this.parent.stat.line += this.lineClear
		this.parent.addScore(`erase${this.lineClear}`)
		this.parent.updateStats()
		this.toCollapse = []
		this.lineClear = 0
		this.alarmCheck()
		this.isDirty = true
		this.parent.piece.isDirty = true
	  }
    } else {
      this.parent.combo = -1
      if (isSpin) {
        if (isMini) {
          sound.add(`voxmini${this.parent.piece.name.toLowerCase()}spin`)
        } else {
          sound.add(`vox${this.parent.piece.name.toLowerCase()}spin0`)
        }
        sound.add(`tspin0${version}`)
        this.parent.addScore("tspin0")
      }
    }
    if (this.parent.combo > 0) {
      sound.add(`ren${this.parent.combo}`)
      if (this.parent.combo <= 5) {
        sound.add("voxren1")
      } else if (this.parent.combo <= 10) {
        sound.add("voxren2")
      } else {
        sound.add("voxren3")
      }
      this.parent.addScore("combo", this.parent.combo)
      if (settings.settings.displayActionText) {
        $("#combo-counter-container").classList.remove("hidden")
        $("#combo-counter").innerHTML = locale.getString(
          "action-text",
          "combo",
          [`<b>${this.parent.combo}</b>`]
        )
        document.documentElement.style.setProperty(
          "--combo-flash-speed",
          Math.max(0.5 - 0.485 * (this.parent.combo / 18), 0.041) + "s"
        )
      }
    } else {
      $("#combo-counter-container").classList.add("hidden")
    }
    if (
      this.parent.piece.areLineLimit === 0 &&
      !settings.settings.stillShowFullActionTextDespiteZeroLineClearAre
    ) {
      this.collapse()
    }
    // console.log(this.highest, this.skyToFloor);
    // console.log(this.skyToFloor);
    this.parent.calculateActionText(
      this.lineClear,
      isSpin,
      isMini,
      this.parent.b2b,
      this.isClutch
    )
    this.isClutch = false
    if (pc) {
      this.parent.stat.pcCount++
      for (let i = 0; i < (200 * this.width) / 10; i++) {
        sound.add("perfectclear")
        const colors = hsvToRgb(Math.random(), 0.7, 1)
        this.parent.particle.generate({
          amount: 1,
          x: 0,
          y:
            this.parent.cellSize *
            (this.parent.bufferPeek + this.parent.stack.height),
          xRange: this.parent.stack.width * this.parent.cellSize,
          yRange: 0,
          xVelocity: 0,
          yVelocity: 5,
          xDampening: 1.03,
          yDampening: 1.01,
          xVariance: 3,
          yVariance: 10,
          red: colors.r,
          green: colors.g,
          blue: colors.b,
          lifeVariance: 2000,
          maxlife: 250,
          flicker: 1,
        })
      }
      sound.add("bravo")
      sound.add("voxperfectclear")
      const options = {
        time: 4000,
        skipDefaultAnimation: true,
        additionalClasses: ["perfect-clear-text"],
      }
      this.parent.displayActionText(
        `<span class="perfect-clear">${locale
          .getString("action-text", "pc")
          .replace(" ", "<br>")}</span>`,
        options
      )
      this.parent.displayActionText(
        `<span class="perfect-clear-secondary">${locale
          .getString("action-text", "pc")
          .replace(" ", "<br>")}</span>`,
        { ...options, time: 2000 }
      )
    }
    if (this.useGarbageSending) {
      garbageToClear += [0, 0, 1, 2, 4, 7][this.lineClear]
      if (isSpin && !isMini) {
        garbageToClear += [0, 2, 3, 4, 4, 4][this.lineClear]
      }
      if (this.parent.b2b > 1 && this.lineClear) {
        garbageToClear++
      }
      const comboIncreaseTable = [2, 5, 7, 9, 12]
      for (const condition of comboIncreaseTable) {
        if (this.parent.combo >= condition) {
          garbageToClear++
        }
      }
      if (pc) {
        garbageToClear += 10
      }
    }
    if (
      Math.max(0, this.waitingGarbage) - garbageToClear < 0 &&
      this.showGarbageSendAnimation
    ) {
      const selectedStartingType = Math.floor(Math.random() * 2)
      const element = document.createElement("div")
      switch (selectedStartingType) {
        case 0:
          element.style.setProperty("--starting-value-left", "0%")
          break
        case 1:
          element.style.setProperty("--starting-value-right", "100%")
          break
      }
      const startingPositionOpposite = Math.random() * 100
      element.style.setProperty(
        "--starting-value-top",
        `${startingPositionOpposite}%`
      )
      const id = `gb-${performance.now()}`
      element.classList.add("garbage-particle")
      element.classList.add("send")
      element.id = id
      $("#game").appendChild(element)
      sound.add("garbagesend")
      setTimeout(() => {
        element.parentNode.removeChild(element)
      }, 330)
    }
    this.waitingGarbage = Math.max(
      this.antiGarbageBuffer,
      this.waitingGarbage - garbageToClear
    )
    if (this.waitingGarbage > 0 && !this.lineClear) {
      const brokenLineLimit = settings.settings.brokenLineLimit
      if (this.waitingGarbage > brokenLineLimit) {
        this.spawnBrokenLine(brokenLineLimit)
        this.waitingGarbage -= brokenLineLimit
      } else {
        this.spawnBrokenLine(this.waitingGarbage)
        this.waitingGarbage = 0
      }
    }
    this.alarmCheck()
    /* if (isMini && this.lineClear >= 2) { // If you uncomment this, the game will softlock on TSDM
    //   this.parent.noUpdate = true;
    } */
    this.parent.updateStats()
	//this.parent.stat.effect = ""
	if (this.parent.currentEffect === "") {
		this.parent.stat.effect = ""
	}
	if (this.parent.useEffectBlocks) {
		if (this.effectBlockInterval <= 4) {
			this.parent.currentEffect = ""
			if (this.refreezeOnEffect) {
				this.isFrozen = true
			}
		}
		if (this.effectBlockInterval <= 3 && this.effectBlockInterval > 0) {
			this.parent.stat.effect = locale.getString("ui", "watchOutWarning")
		} else {
			this.parent.stat.effect = ""
		}
	}
	if (this.parent.currentEffect === "holdLock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "holdLock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "holdLock")
	}
	if (this.parent.currentEffect === "rotateLock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "rotateLock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "rotateLock")
	}
	if (this.parent.currentEffect === "hideNext") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "hideNext")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "hideNext")
	}
	if (this.parent.currentEffect === "mirrorBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "mirrorBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "mirrorBlock")
	}
	if (this.parent.currentEffect === "fadingBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "fadingBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "fadingBlock")
	}
	if (this.parent.currentEffect === "phantomBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "phantomBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = locale.getString("effects", "phantomBlock")
	}
	if (this.parent.currentEffect === "delFieldUp") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "delFieldUp")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "delFieldDown") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "delFieldDown")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "garbageBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "garbageBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "laserBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "laserBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "flipBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "flipBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "jewelBlock") {
		if (this.displayedEffectText !== true) {
			this.displayedEffectText = true
			let effectName = locale.getString("effects", "jewelBlock")
			$("#message").classList.add("effectactivated")
			$("#message").textContent = `${effectName}!`
			resetAnimation("#message", "dissolve")
		}
		this.parent.stat.effect = ""
	}
	if (this.parent.currentEffect === "mirrorBlock" && this.toCollapse.length <= 0) {
		if (this.parent.useEffectBlocks) {
			if (this.effectBlockInterval < 16) {
				this.mirrorGrid()
			}
		} else {
			this.mirrorGrid()
		}
	}
	if (this.parent.currentEffect === "deathBlock") {
		$("#kill-message").textContent = locale.getString("ui", "topOut")
        sound.killVox()
        sound.add("voxtopout")
        this.parent.end()
	}
	if (this.parent.currentEffect === "" && this.parent.useEffectBlocks) {
		this.displayedEffectText = false
		$("#message").classList.remove("effectactivated")
	} else if (this.parent.useEffectBlocks !== true) {
		this.displayedEffectText = true
		$("#message").classList.remove("effectactivated")
	}
	if (this.parent.stat.level !== this.levelGauge) {
		this.levelGauge += 1
		if (this.parent.pps >= 2) {
			this.sectionGauge += 1
		}
	}
	this.updateMedals()
  }
  alarmCheck() {
    if (this.parent.type === "zen") {
      return
    }
    if (
      this.height - this.highest - Math.max(0, this.waitingGarbage) < 2 ||
      (((this.height - this.highest - Math.max(0, this.waitingGarbage) < 5 &&
        !this.alarmIsOn) ||
        (this.height - this.highest - Math.max(0, this.waitingGarbage) < 8 &&
          this.alarmIsOn)) &&
        this.skyToFloor - this.hiddenHeight < this.height - 4)
    ) {
      this.startAlarm()
    } else {
      this.endAlarm()
    }
  }
  updateGrid() {
    if (this.parent.hideGrid || settings.settings.gridStyle === "off") {
      document.documentElement.style.setProperty("--grid-image", "url()")
      return
    }
    const gridName = settings.settings.gridStyle
    if (this.alarmIsOn) {
      document.documentElement.style.setProperty(
        "--grid-image",
        `url("../img/tetrion/grid-bg-${gridName}-danger.svg")`
      )
    } else {
      document.documentElement.style.setProperty(
        "--grid-image",
        `url("../img/tetrion/grid-bg-${gridName}.svg")`
      )
    }
  }
  startAlarm() {
    if (this.alarmIsOn) {
      return
    }
    sound.raiseDangerBgm()
    sound.startSeLoop("alarm")
    this.alarmIsOn = true
    this.updateGrid()
    document.documentElement.style.setProperty("--tetrion-color", "#f00")
    $("#next-piece").classList.add("danger")
  }
  endAlarm() {
    sound.lowerDangerBgm()
    sound.stopSeLoop("alarm")
    this.alarmIsOn = false
    this.updateGrid()
    document.documentElement.style.setProperty("--tetrion-color", "#fff")
    $("#next-piece").classList.remove("danger")
  }
  addGarbageToCounter(amount = 1) {
    const selectedStartingType = Math.floor(Math.random() * 2)
    const element = document.createElement("div")
    switch (selectedStartingType) {
      case 0:
        element.style.setProperty("--starting-value-left", "0%")
        break
      case 1:
        element.style.setProperty("--starting-value-right", "100%")
        break
    }
    const startingPositionOpposite = Math.random() * 100
    element.style.setProperty(
      "--starting-value-top",
      `${startingPositionOpposite}%`
    )
    const id = `gb-${performance.now()}`
    element.classList.add("garbage-particle")
    element.id = id
    $("#game").appendChild(element)
    sound.add("garbagefly")
    setTimeout(() => {
      this.waitingGarbage += amount
      this.parent.piece.isDirty = true
      this.parent.shakeMatrix()
      sound.add("garbagereceive")
      this.alarmCheck()
      element.parentNode.removeChild(element)
    }, 330)
  }
  spawnBrokenLine(amount = 1) {
    sound.add("garbage")
    this.parent.shiftMatrix("up")
    let topOut = false
    for (let i = 0; i < amount; i++) {
      // if (this.garbageHoleUsed >= this.garbageSwitchRate && !this.copyBottomForGarbage) {
      //   const last = this.garbageRandomHole;
      //   while (this.garbageRandomHole === last) {
      if (Math.random() > 0.7) {
        this.garbageRandomHole = Math.floor(Math.random() * this.grid.length)
      }
      //   }
      //   this.garbageHoleUsed = 0;
      // }
      for (let i = 0; i < this.flashY.length; i++) {
        this.flashY[i]--
      }
      for (let x = 0; x < this.grid.length; x++) {
        if (this.grid[x][0]) {
          topOut = true
        }
        for (let shiftY = 0; shiftY < this.grid[0].length; shiftY++) {
          this.grid[x][shiftY] = this.grid[x][shiftY + 1]
        }
        if (
          this.copyBottomForGarbage &&
          !this.grid[x][this.grid[0].length - 2]
        ) {
          continue
        }
        if (x === this.garbageRandomHole && !this.copyBottomForGarbage) {
          continue
        }
        this.grid[x][this.grid[0].length - 1] = "black"
      }
      if (this.parent.piece.isStuck) {
        this.parent.piece.y--
      }
      this.garbageHoleUsed++
    }
    this.alarmCheck()
    this.makeAllDirty()
    this.isDirty = true
    this.parent.piece.isDirty = true
    if (topOut) {
      $("#kill-message").textContent = locale.getString("ui", "topOut")
      sound.killVox()
      sound.add("voxtopout")
      this.parent.end()
      return
    }
  }
  clearUnderwaterRows() {
	  this.cleanUnderwaterRows = true
  }
  collapse() {
    if (this.toCollapse.length === 0) {
	  return
    }
	//console.log(this.toCollapse)
	let fallenBlocks = 0
	let bottomLine = this.height + this.hiddenHeight - 1
	let underwaterHeightPosition = this.height + this.hiddenHeight - this.underwaterHeight
	if (this.isUnderwater) {
		if (this.cleanUnderwaterRows) {
			//this.toCollapse = [...this.toCollapseUnderwater, ...this.toCollapse]
			if (this.toCollapseUnderwater.length > 0) {
				for (const y of this.toCollapseUnderwater) {
					if (this.arrayContains(this.toCollapse, y) !== true) {
						this.toCollapse.push(y)
					}
				}
			}
			this.toCollapseUnderwater = []
			this.cleanUnderwaterRows = false
		}
	} else {
		//this.toCollapse = [...this.toCollapseUnderwater, ...this.toCollapse]
		if (this.toCollapseUnderwater.length > 0) {
			for (const y of this.toCollapseUnderwater) {
				if (this.arrayContains(this.toCollapse, y) !== true) {
					this.toCollapse.push(y)
				}
			}
		}
		this.toCollapseUnderwater = []
	}
    if (this.isFrozen) {
	if (this.lineClear >= 4) {
		if (this.arrayContains(this.toCollapse, bottomLine) !== true) {
			this.toCollapse.push(bottomLine)
		}
	}
	for (const y of this.toCollapse) {
      for (let x = 0; x < this.grid.length; x++) {
        for (let shiftY = y; shiftY >= 0; shiftY--) { 
		  if (this.noFrozenMinos() === true) {
			this.grid[x][shiftY] = this.grid[x][shiftY - 1]
			if (
				this.grid[x][shiftY] != null &&
				this.grid[x][shiftY - 1] != null
			) {
				fallenBlocks++
			}
			this.dirtyCells.push([x, shiftY + 1])
		  } else if (y === bottomLine && this.lineClear >= 4) {
			this.grid[x][shiftY] = this.grid[x][shiftY - 1]
			if (
				this.grid[x][shiftY] != null &&
				this.grid[x][shiftY - 1] != null
			) {
				fallenBlocks++
			}
			this.dirtyCells.push([x, shiftY + 1])
		  }
        }
      }
      for (let i = 0; i < this.flashY.length; i++) {
        if (this.flashY[i] < y) {
          this.flashY[i]++
        }
      }
    }
	this.reRenderStack()
	} else {
	for (const y of this.toCollapse) {
      for (let x = 0; x < this.grid.length; x++) {
        for (let shiftY = y; shiftY >= 0; shiftY--) {
          this.grid[x][shiftY] = this.grid[x][shiftY - 1]
          if (
            this.grid[x][shiftY] != null &&
            this.grid[x][shiftY - 1] != null
          ) {
            fallenBlocks++
          }
          this.dirtyCells.push([x, shiftY + 1])
        }
      }
      for (let i = 0; i < this.flashY.length; i++) {
        if (this.flashY[i] < y) {
          this.flashY[i]++
        }
      }
    }}
    this.parent.stat.line += this.lineClear
    this.parent.addScore(`erase${this.lineClear}`)
    this.parent.updateStats()
    if (fallenBlocks !== 0) {
      sound.add("collapse")
      if (this.lineClear >= 4) {
        sound.add("collapse4")
      } else {
        sound.add("collapsenot4")
      }
    }
    this.parent.particle.generate({
      amount: 100,
      x: 0,
      y:
        (this.toCollapse[this.toCollapse.length - 1] - this.hiddenHeight + 1) *
        this.parent.cellSize,
      xRange: this.width * this.parent.cellSize,
      yRange: 0,
      xVelocity: 0,
      yVelocity: 1,
      xVariance: 5,
      yVariance: 2,
      gravity: 0.3,
      gravityAccceleration: 1.05,
      lifeVariance: 80,
    })
    this.toCollapse = []
    this.lineClear = 0
    this.alarmCheck()
    this.isDirty = true
    this.parent.piece.isDirty = true
	if (this.parent.currentEffect === "delFieldUp") {
		this.sliceGridTop()
		this.parent.currentEffect = ""
	}
	if (this.parent.currentEffect === "delFieldDown") {
		this.sliceGridBottom()
		this.parent.currentEffect = ""
	}
	if (this.parent.currentEffect === "garbageBlock") {
		this.addGarbageToCounter(4)
		this.parent.currentEffect = ""
	}
	if (this.parent.currentEffect === "laserBlock") {
		this.laserGrid()
		this.parent.currentEffect = ""
	}
	if (this.parent.currentEffect === "flipBlock") {
		this.flipGrid()
		this.parent.currentEffect = ""
	}
	if (this.parent.currentEffect === "mirrorBlock") {
		if (this.parent.useEffectBlocks) {
			if (this.effectBlockInterval < 16) {
				this.mirrorGrid()
			}
		} else {
			this.mirrorGrid()
		}
	}
	if (this.parent.currentEffect === "jewelBlock") {
		if (this.isFrozen) {
			this.refreezeOnEffect = true
			this.isFrozen = false
		}
		this.gemIfyPlacedMinos()
		this.parent.currentEffect = ""
	}
  }
  new() {
    const cells = new Array(this.width)
    for (let i = 0; i < this.width; i++) {
      cells[i] = new Array(this.height + this.hiddenHeight)
    }
    this.grid = cells
  }
  endRollStart() {
	  sound.add("endingstart")
	  this.new()
	  this.makeAllDirty()
	  this.isDirty = true
  }
  get highest() {
    let highest = 0
    for (const currentY of this.grid) {
      for (let i = 0; i < currentY.length; i++) {
        if (currentY[i] != null) {
          const iReverse = currentY.length - i
          highest = Math.max(highest, iReverse)
          break
        }
      }
    }
    return highest
  }
  getHighestOfColumn(x) {
    let highest = 0
    for (let i = 0; i < this.grid[x].length; i++) {
      if (this.grid[x][i] != null) {
        const iReverse = this.grid[x].length - i
        highest = Math.max(highest, iReverse)
        break
      }
    }
    return highest
  }
  get skyToFloor() {
    let amount = 0
    for (const currentY of this.grid) {
      let passed = true
      for (let i = 0; i < currentY.length; i++) {
        if (currentY[i] != null) {
          amount = Math.max(amount, i)
          passed = false
          break
        }
      }
      if (passed) {
        amount = Math.max(amount, this.height + this.hiddenHeight)
      }
    }
    return amount
  }
  isFilled(x, y, grid = this.grid) {
    if (grid[x] != null) {
      if (y < this.height + this.hiddenHeight) {
        if (grid[x][y] != null) {
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    } else {
      return true
    }
  }
  draw() {
    const cellSize = this.parent.cellSize
    const buffer = this.parent.bufferPeek
    const ctx = this.ctx
    const flash = (
      "0" +
      Math.floor((1 - this.flashTime / this.flashLimit) * 255).toString(16)
    ).slice(-2)
    // clearCtx(this.ctx);
    this.dirtyCells = Array.from(
      new Set(this.dirtyCells.map(JSON.stringify)),
      JSON.parse
    )
    for (const cell of this.dirtyCells) {
      const x = cell[0] * cellSize
      const y = (cell[1] - this.hiddenHeight) * cellSize + buffer * cellSize
      ctx.clearRect(x, Math.floor(y), cellSize, cellSize)
    }
    /*
    for (let x = 0; x < this.grid.length; x++) {
      for (let y = 0; y < this.grid[x].length; y++) {
        const isFilled = this.grid[x][y];
        if (isFilled) {
          const color = this.grid[x][y];
          let name = 'stack';
          if (this.useMinoSkin) {
            name = 'mino';
          }
          const img = document.getElementById(`${name}-${color}`);
          const xPos = x * cellSize;
          const yPos = y * cellSize + cellSize * buffer - cellSize * this.hiddenHeight;
          img.height = cellSize;
          ctx.drawImage(img, xPos, Math.floor(yPos), cellSize, cellSize);
        }
      }
    }
    */
    const levelUpLength =
      (this.height * this.levelUpAnimation) / this.levelUpAnimationLimit
    for (const cell of this.dirtyCells) {
      const x = cell[0]
      const y = cell[1]
      const isFilled = this.grid[x][y]
      if (isFilled && !this.isInvisible) {
        let color = this.grid[x][y]
        let name = "mino"
        if (this.useMinoSkin) {
          name = "mino"
        }
        let suffix = ""
        if (this.parent.piece.useRetroColors) {
          let modifier = 0
          if (this.levelUpAnimation < this.levelUpAnimationLimit) {
            if (y - 3 <= this.height - levelUpLength) {
              modifier--
            }
          }
          suffix = `-${negativeMod(this.parent.stat.level + modifier, 10)}`
        }
		if (this.isHidden && this.redrawOnHidden) {
			color = "hidden"
			suffix = ""
		}
		if (this.parent.currentEffect === "phantomBlock") {
			color = "hidden"
			suffix = ""
		}
        const img = document.getElementById(`${name}-${color}${suffix}`)
        const xPos = x * cellSize
        const yPos =
          y * cellSize + cellSize * buffer - cellSize * this.hiddenHeight
        img.height = cellSize
        ctx.drawImage(img, xPos, Math.floor(yPos), cellSize, cellSize)
        ctx.globalCompositeOperation = "multiply"
        ctx.fillStyle = "#0003"
        ctx.fillRect(xPos, Math.floor(yPos), cellSize, cellSize)
      }
    }
    // Flash
    if (this.flashTime < this.flashLimit) {
      for (let i = 0; i < this.flashX.length; i++) {
        ctx.globalCompositeOperation = "overlay"
        const x = this.flashX[i] * cellSize
        const y =
          this.flashY[i] * cellSize +
          cellSize * buffer -
          cellSize * this.hiddenHeight
        ctx.fillStyle = `#ffffff${flash}`
        if (
          settings.settings.lockFlash !== "off" &&
          settings.settings.lockFlash !== "flash"
        ) {
          ctx.fillRect(x, Math.floor(y), cellSize, cellSize)
        }
        if (settings.settings.lockFlash === "shine") {
          const float = (this.flashTime * 2) / this.flashLimit
          const mod = 0.2
          const getDistanceX = (modifier = 0) => {
            return Math.min(
              Math.min(Math.max(Math.max(0, float * 2 - 1 + modifier), 0), 1) *
                cellSize,
              cellSize
            )
          }
          const getDistanceY = (modifier = 0) => {
            return Math.min(
              cellSize -
                Math.min(Math.max(Math.min(float * 2 + modifier, 1), 0), 1) *
                  cellSize,
              cellSize
            )
          }
          const distance1x = getDistanceX(-mod)
          const distance1y = getDistanceY(-mod)
          const distance2x = getDistanceX(+mod)
          const distance2y = getDistanceY(+mod)
          const cornerX = Math.min(distance1x, distance2x)
          const cornerY = Math.min(distance1y, distance2y)

          ctx.beginPath()
          ctx.moveTo(x + distance1x, Math.floor(y + distance1y))
          ctx.lineTo(
            x + cellSize - distance1y,
            Math.floor(y + cellSize - distance1x)
          )
          ctx.lineTo(x + cellSize - cornerY, Math.floor(y + cellSize - cornerX))
          ctx.lineTo(
            x + cellSize - distance2y,
            Math.floor(y + cellSize - distance2x)
          )
          ctx.lineTo(x + distance2x, Math.floor(y + distance2y))
          ctx.lineTo(x + cornerX, Math.floor(y + cornerY))
          ctx.fillStyle = "#fff"
          ctx.fill()
        }
        // Solid white 2f
        if (this.flashTime < 50 && settings.settings.lockFlash !== "off") {
          ctx.globalCompositeOperation = "source-over"
          ctx.fillStyle = `#fff`
          ctx.fillRect(x, Math.floor(y), cellSize, cellSize)
        }
      }
    }
    // Line clear animation
    if (this.toCollapse.length > 0 && this.isFrozen !== true) {
      const brightness = Math.max(
        0,
        1 -
          this.parent.piece.are /
            (this.parent.piece.areLimit +
              this.parent.piece.areLimitLineModifier)
      )
      let brightnessHex = (
        "0" + Math.round(brightness * 255).toString(16)
      ).slice(-2)
      if (!this.fadeLineClear) {
        brightnessHex = "ff"
      }
      ctx.fillStyle = `#ffffff${brightnessHex}`
      for (let i = 0; i < this.toCollapse.length; i++) {
        ctx.clearRect(
          0,
          Math.floor(
            (this.toCollapse[i] - this.hiddenHeight) * cellSize +
              buffer * cellSize
          ),
          cellSize * this.width,
          cellSize
        )
        this.parent.particle.generate({
          amount: 2,
          x: 0,
          y: (this.toCollapse[i] - this.hiddenHeight + buffer) * cellSize,
          xRange: this.width * cellSize,
          yRange: cellSize,
          xVelocity: 0,
          yVelocity: 0,
          xVariance: 10,
          yVariance: 10,
          xDampening: 1.03,
          yDampening: 1.03,
          lifeVariance: 80,
        })
        if (
          Math.round(this.parent.piece.are / this.flashClearRate) % 2 !== 1 ||
          !this.flashLineClear
        ) {
          ctx.fillRect(
            0,
            Math.floor(
              (this.toCollapse[i] - this.hiddenHeight) * cellSize +
                buffer * cellSize
            ),
            cellSize * this.width,
            cellSize
          )
        }
      }
  } else if (this.isFrozen === true) {
	  for (const i of this.toCollapse) {
		this.parent.particle.generate({
          amount: 2,
          x: 0,
          y: (this.toCollapse[i] - this.hiddenHeight + buffer) * cellSize,
          xRange: this.width * cellSize,
          yRange: cellSize,
          xVelocity: 0,
          yVelocity: 0,
          xVariance: 10,
          yVariance: 10,
          xDampening: 1.03,
          yDampening: 1.03,
          lifeVariance: 80,
        })
	  }
	  this.reRenderStack()
  }
    this.dirtyCells = []
  }
  linesToLevel(levelLimit, levelsPerSection) {
    const newLevel = Math.min(
      levelLimit,
      this.parent.stat.level + this.parent.stack.lineClear
    )
    if (
      Math.floor(this.parent.stat.level / levelsPerSection) <
      Math.floor(newLevel / levelsPerSection)
    ) {
      if (newLevel !== levelLimit) {
		  sound.add("levelup")
		  sound.add("levelupmajor")
	  }
    }
    this.parent.stat.level = newLevel
  }
  arcadeScore(drop = 0, multiplier = 1) {
    let pc = true
    for (let x = 0; x < this.grid.length; x++) {
      if (!pc) {
        break
      }
      for (
        let y = 0;
        y < this.grid[x].length - this.parent.stack.lineClear;
        y++
      ) {
        const isFilled = this.grid[x][y]
        if (isFilled) {
          pc = false
          break
        }
      }
    }
    const bravo = pc ? 4 : 1
    if (this.parent.stack.lineClear !== 0) {
      this.parent.arcadeCombo += 2 * (this.parent.stack.lineClear - 1)
    } else this.parent.arcadeCombo = 1
    this.parent.stat.score +=
      Math.ceil(
        (this.parent.stat.level + this.parent.stack.lineClear) / 4 + drop
      ) *
      this.parent.stack.lineClear *
      this.parent.arcadeCombo *
      bravo *
      multiplier
  }
  addStaticScore(score = 0) {
    this.parent.stat.score += score
  }
}
