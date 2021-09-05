"use strict";

import { libWrapper } from "./module/shim.js";

Hooks.once("init", () => {
  game.settings.register("sensor-sight", "combine-observers", {
    name: "See through all observed tokens",
    hint: `When determining if a token is visible, check all observable tokens \
           instead of just owned tokens. This setting only affects players.`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => canvas.sight.refresh(),
  });

  libWrapper.register(
    "sensor-sight",
    "SightLayer.prototype.testVisibility",
    function (w, point, { tolerance = 2, object = null } = {}) {
      // default logic
      const r = w.apply(this, [point, { tolerance, object }]);
      // is this within sensor range of any controlled token?
      const obs = game.settings.get("sensor-sight", "combine-observers");
      const s = (
        game.user.isGM ? canvas.tokens.controlled : canvas.tokens.placeables
      )
        .filter(t => (obs ? t.observer : t.owner))
        .reduce((a, t) => {
          return a || inSensorRange(t, point);
        }, r);
      return s;
    }
  );

  libWrapper.register(
    "sensor-sight",
    "Token.prototype.isVisible",
    function (w) {
      const vis = w.apply(this);
      if (this.data.hidden) return game.user.isGM;
      const tolerance = Math.round(
        Math.min(canvas.grid.grid.w, canvas.grid.grid.h) / 4
      );
      return (
        vis ||
        Array.from(this.getOccupiedSpaces()).reduce((a, p) => {
          return (
            a || canvas.sight.testVisibility(p, { tolerance, object: this })
          );
        }, false)
      );
    }
  );
});

function inSensorRange(token, point) {
  const sensors = token.actor.data.data.derived.mm?.SensorRange;
  const spaces = Array.from(token.getOccupiedSpaces());
  // On gridless, so just use center.
  if (!spaces.length) spaces.push(token.center);
  const rays = spaces.map(p => {
    return { ray: new Ray(p, point) };
  });
  const min_d = Math.min(
    ...canvas.grid.grid.measureDistances(rays, { gridSpaces: true })
  );
  return sensors >= min_d;
}
