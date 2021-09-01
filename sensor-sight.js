'use strict';

import {libWrapper} from './module/shim.js';

Hooks.once('setup', () => {
  libWrapper.register('sensor-sight', 'SightLayer.prototype.testVisibility', function (w, point, {tolerance=2, object=null}={}) {
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
  const sensors = token.actor.data.data.derived.mm?.SensorRange;
  const rays = Array.from(token.getOccupiedSpaces()).map(p => {
    return { ray: new Ray(p, point) };
  });
  const min_d = Math.min(...canvas.grid.grid.measureDistances(rays, {gridSpaces: true }));
  return sensors >= min_d;
}
