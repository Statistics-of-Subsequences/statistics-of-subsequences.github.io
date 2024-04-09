/* The controller can register callbacks for various events on a canvas:
 *
 * keyPress: function(keys)
 *    receives key press events
 * 
 * mousemove: function(prevMouse, curMouse, event)
 *     receives both regular mouse events, and single-finger drags (sent as a left-click),
 *
 * mousePress: function(curMouse, event)
 *     receives mouse click and touch start events
 *
 * wheel: function(amount)
 *     mouse wheel scrolling
 *
 * pinch: function(amount)
 *     two finger pinch, receives the distance change between the fingers
 *
 * twoFingerDrag: function(dragVector)
 *     two finger drag, receives the drag movement amount
 */
export default class Controller {
    constructor() {
        this.keyPress = null;
        this.mousemove = null;
        this.mousePress = null;
        this.wheel = null;
        this.twoFingerDrag = null;
        this.pinch = null;
    }

    registerForCanvas(canvas) {
        var currKeys = [];
        var prevMousePos = null;
        var currMousePos = null;
        var self = this;

        document.addEventListener("keydown", function (event) {
            if (currKeys.indexOf(event.code) == -1) {
                currKeys.push(event.code);
            }
            if (self.keyPress) {
                self.keyPress(currKeys);
            }
        });

        document.addEventListener("keyup", function (event) {
            var idx = currKeys.indexOf(event.code);
            if (idx != -1) {
                currKeys.splice(idx, 1);
            }
        });

        canvas.addEventListener("mousedown", function (event) {
            event.preventDefault();
            canvas.style.cursor = "none";
            var rect = canvas.getBoundingClientRect();
            currMousePos = [event.clientX - rect.left, event.clientY - rect.top];
            if (self.mousePress) {
                self.mousePress(mousePos, event);
            }
        });

        canvas.addEventListener("mouseup", function (event) {
            event.preventDefault();
            canvas.style.cursor = "default";
        });

        canvas.addEventListener("mousemove", function (event) {
            event.preventDefault();
            var rect = canvas.getBoundingClientRect();
            currMousePos = [event.clientX - rect.left, event.clientY - rect.top];
            if (self.mousemove) {
                self.mousemove(prevMousePos, currMousePos, event);
            }
            prevMousePos = currMousePos;
        });

        canvas.addEventListener("wheel", function (event) {
            event.preventDefault();
            if (self.wheel) {
                self.wheel(event.deltaY);
            }
        });

        canvas.oncontextmenu = function (event) {
            event.preventDefault();
        };

        var touches = {};
        canvas.addEventListener("touchstart", function (event) {
            event.preventDefault();
            var rect = canvas.getBoundingClientRect();
            for (var i = 0; i < event.changedTouches.length; ++i) {
                var t = event.changedTouches[i];
                touches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
                if (event.changedTouches.length == 1 && self.press) {
                    self.press(touches[t.identifier], event);
                }
            }

        });

        canvas.addEventListener("touchmove", function (event) {
            event.preventDefault();
            var rect = canvas.getBoundingClientRect();
            var numTouches = Object.keys(touches).length;
            // Single finger to rotate the camera
            if (numTouches == 1) {
                if (self.mousemove) {
                    var t = event.changedTouches[0];
                    var preventouch = touches[t.identifier];
                    var curTouch = [t.clientX - rect.left, t.clientY - rect.top];
                    event.buttons = 1;
                    self.mousemove(preventouch, curTouch, event);
                }
            } else {
                var curTouches = {};
                for (var i = 0; i < event.changedTouches.length; ++i) {
                    var t = event.changedTouches[i];
                    curTouches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
                }

                // If some touches didn't change make sure we have them in
                // our curTouches list to compute the pinch distance
                // Also get the old touch points to compute the distance here
                var oldTouches = [];
                for (t in touches) {
                    if (!(t in curTouches)) {
                        curTouches[t] = touches[t];
                    }
                    oldTouches.push(touches[t]);
                }

                var newTouches = [];
                for (t in curTouches) {
                    newTouches.push(curTouches[t]);
                }

                // Determine if the user is pinching or panning
                var motionVectors = [
                    vec2(newTouches[0][0] - oldTouches[0][0], newTouches[0][1] - oldTouches[0][1]),
                    vec2(newTouches[1][0] - oldTouches[1][0], newTouches[1][1] - oldTouches[1][1])
                ];
                var motionDirs = [normalize(motionVectors[0]), normalize(motionVectors[1])];

                var pinchAxis = vec2(oldTouches[1][0] - oldTouches[0][0], oldTouches[1][1] - oldTouches[0][1]);
                pinchAxis = normalize(pinchAxis);

                var panAxis = mix(motionVectors[0], motionVectors[1], 0.5);
                panAxis = normalize(panAxis);

                var pinchMotion = [
                    dot(pinchAxis, motionDirs[0]),
                    dot(pinchAxis, motionDirs[1])
                ];
                var panMotion = [
                    dot(panAxis, motionDirs[0]),
                    dot(panAxis, motionDirs[1])
                ];

                // If we're primarily moving along the pinching axis and in the opposite direction with
                // the fingers, then the user is zooming.
                // Otherwise, if the fingers are moving along the same direction they're panning
                if (self.pinch && Math.abs(pinchMotion[0]) > 0.5 && Math.abs(pinchMotion[1]) > 0.5
                    && Math.sign(pinchMotion[0]) != Math.sign(pinchMotion[1])) {
                    // Pinch distance change for zooming
                    var oldDist = distance(oldTouches[0], oldTouches[1]);
                    var newDist = distance(newTouches[0], newTouches[1]);
                    self.pinch(5 * (oldDist - newDist));
                } else if (self.twoFingerDrag && Math.abs(panMotion[0]) > 0.5 && Math.abs(panMotion[1]) > 0.5
                    && Math.sign(panMotion[0]) == Math.sign(panMotion[1])) {
                    // Pan by the average motion of the two fingers
                    var panAmount = mix(motionVectors[0], motionVectors[1], 0.5);
                    self.twoFingerDrag(panAmount);
                }
            }

            // Update the existing list of touches with the current positions
            for (var i = 0; i < event.changedTouches.length; ++i) {
                var t = event.changedTouches[i];
                touches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
            }
        });

        var touchEnd = function (event) {
            event.preventDefault();
            for (var i = 0; i < event.changedTouches.length; ++i) {
                var t = event.changedTouches[i];
                delete touches[t.identifier];
            }
        };

        canvas.addEventListener("touchcancel", touchEnd);
        canvas.addEventListener("touchend", touchEnd);
    }
}

