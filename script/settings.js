import menu from "./menu/menu.js"
import sound from "./sound.js"
import locale from "./lang.js"
const SETTINGS_VERSION = 5.1
class Settings {
  constructor() {
    this.defaultSettings = {
      language: "en_US",
      // Tuning
      DAS: 150,
      ARR: 1000 / 60,
      IRS: "tap",
      IHS: "tap",
      IAS: true,
      rotationSystem: "krs",
      spinDetectionType: "auto",
      useAre: true,
      useLineClearAre: true,
      stillShowFullActionTextDespiteZeroLineClearAre: false,
      shapeOverride: "tetro",
      useLockOut: true,
      brokenLineLimit: 40,
      // Graphics
      theme: "default",
      size: 100,
      nextLength: 3,
      skin: "auto",
      color: "auto",
      colorI: "auto",
      colorL: "auto",
      colorO: "auto",
      colorZ: "auto",
      colorT: "auto",
      colorJ: "auto",
      colorS: "auto",
      outline: "on",
      ghost: "color",
      backgroundOpacity: 30,
      gridStyle: "none",
      lockFlash: "dim",
      actionText: true,
      matrixSwayScale: 0,
      matrixSwaySpeed: 50,
      visualInitial: true,
      particles: true,
      particleLimit: 1500,
      particleSize: 3,
      particleScale: 2,
      useLockdownBar: true,
      displayActionText: true,
      spinZ: true,
      spinL: true,
      spinO: true,
      spinS: true,
      spinI: true,
      spinJ: true,
      spinT: true,
      // Audio
      sfxVolume: 50,
      musicVolume: 50,
      voiceVolume: 100,
      soundbank: "auto",
      nextSoundbank: "auto",
      voicebank: "off",
    }
    switch (navigator.language.substr(0, 2)) {
      case "ja":
        this.defaultSettings.language = "ja_JP"
        break
	  case "zh":
        this.defaultSettings.language = "zh_CN"
        break
	  default:
        this.defaultSettings.language = "en_US"
        break
    }
    switch (this.defaultSettings.language) {
      case "ja_JP":
        this.defaultSettings.voicebank = "off"
        break
	  case "zh_CN":
        this.defaultSettings.voicebank = "off"
        break
	  default:
        this.defaultSettings.voicebank = "off"
        break
    }
    this.defaultControls = {
      moveLeft: ["ArrowLeft"],
      moveRight: ["ArrowRight"],
      hardDrop: ["Space"],
      softDrop: ["ArrowDown"],
      rotateLeft: ["KeyZ", "ControlLeft"],
      rotateRight: ["KeyX", "ArrowUp"],
      rotate180: ["KeyA", "KeyS"],
	  specialKey: ["KeyD", "ShiftLeft"],
      hold: ["KeyC"],
      retry: ["KeyR"],
      pause: ["Escape"],
	  testModeKey: ["Pause", "F4"],
    }
    this.defaultGame = {}
    this.settings = {}
    this.controls = {}
    this.game = {}
  }
  resetSettings() {
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings))
  }
  resetControls() {
    this.controls = JSON.parse(JSON.stringify(this.defaultControls))
  }
  resetGame() {
    this.game = JSON.parse(JSON.stringify(this.defaultGame))
  }
  load() {
    for (const index of ["Settings", "Controls", "Game"]) {
      const loaded = JSON.parse(localStorage.getItem(`tetra${index}`))
      if (
        loaded === null ||
        parseInt(localStorage.getItem("tetraVersion")) !== SETTINGS_VERSION
      ) {
        this[`reset${index}`]()
      } else {
        this[index.toLowerCase()] = JSON.parse(JSON.stringify(loaded))
        if (index === "Game") {
          this[index.toLowerCase()] = {
            ...JSON.parse(JSON.stringify(this[`default${index}`])),
            ...JSON.parse(JSON.stringify(this[index.toLowerCase()])),
          }
          for (const key of Object.keys(this.defaultGame)) {
            this[index.toLowerCase()][key] = {
              ...JSON.parse(JSON.stringify(this[`default${index}`][key])),
              ...JSON.parse(JSON.stringify(this[index.toLowerCase()][key])),
            }
          }
          continue
        }
        this[index.toLowerCase()] = {
          ...JSON.parse(JSON.stringify(this[`default${index}`])),
          ...JSON.parse(JSON.stringify(this[index.toLowerCase()])),
        }
      }
    }
    this.saveAll()
  }
  saveSettings() {
    localStorage.setItem("tetraSettings", JSON.stringify(this.settings))
  }
  saveControls() {
    localStorage.setItem("tetraControls", JSON.stringify(this.controls))
  }
  saveGame() {
    localStorage.setItem("tetraGame", JSON.stringify(this.game))
  }
  saveVersion() {
    localStorage.setItem("tetraVersion", SETTINGS_VERSION)
  }
  saveAll() {
    this.saveSettings()
    this.saveControls()
    this.saveGame()
    this.saveVersion()
  }
  resetGameSpecific(mode) {
    this.game[mode] = this.defaultGame[mode]
  }
  changeSetting(setting, value, game) {
    if (game) {
      this.game[game][setting] = value
    } else {
      this.settings[setting] = value
    }
    sound.updateVolumes()
    if (game) {
      this.saveGame()
    }
    this.saveSettings()
  }
  getConflictingControlNames() {
    const keyFrequency = {}
    const duplicates = [""]
    for (const key of Object.keys(this.controls)) {
      for (const name of this.controls[key]) {
        if (keyFrequency[name] == null) {
          keyFrequency[name] = 1
        } else {
          keyFrequency[name]++
          duplicates.unshift(name)
        }
      }
    }
    return duplicates
  }
  addControl(key, control) {
    const array = this.controls[key]
    const index = array.indexOf(control)
    if (index === -1) {
      array.push(control)
    }
    this.saveControls()
    menu.drawControls()
  }
  removeControl(key, control) {
    const array = this.controls[key]
    const index = array.indexOf(control)
    if (index !== -1) {
      array.splice(index, 1)
    }
    this.saveControls()
    menu.drawControls()
  }
}
const settings = new Settings()
export default settings
