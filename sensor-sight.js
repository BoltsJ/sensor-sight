'use strict';

import {libWrapper} from './module/shim.js';

Hooks.once('setup', () => {
  libWrapper.register('sight-test', 'SightLayer.prototype.testVisibility', function (w, point, {tolerance=2, object=null}={}) {
    // default logic
    let r = w.apply(this, [point, {tolerance, object}]);
    // is this within sensor range of any controlled token?
    let s = canvas.tokens.controlled.reduce((a, t) => {
      return a || inSensorRange(t, point);
    }, false);
    return r || s;
  });
});

function inSensorRange(token, point) {
  const sensors = token.actor.data.data.mech?.sensors
  if (sensors === undefined) return false;
  const range = Math.sqrt((token.x - point.x) * (token.x - point.x) + (token.y - point.y) * (token.y - point.y));
  const scale = canvas.scene.data.gridType > 1 ? Math.sqrt(3) / 2 : 1;// Adjust the measurment on hexes
  const grid = canvas.scene.data.grid;
  return (sensors + .6) * grid * scale > range;
  console.log(range);
}
