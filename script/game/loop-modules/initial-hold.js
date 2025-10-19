import input from "../../input.js"
import sound from "../../sound.js"
import settings from "../../settings.js"

export default function initialHold(arg) {
  if (arg.currentEffect === "holdLock") {
	arg.hold.ihs = false
	return
  }
  if (input.getGamePress("hold") && settings.settings.IHS === "tap") {
    arg.piece.isDirty = true
    sound.add("initialuse")
    arg.hold.ihs = true
  }
}
