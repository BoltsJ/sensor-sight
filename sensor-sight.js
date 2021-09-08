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
    "Token.prototype.isVisible",
    function (wrapped) {
      const vis = wrapped.apply(this);
      if (this.data.hidden) return game.user.isGM;
      const obs = game.settings.get("sensor-sight", "combine-observers");
      const s = (
        game.user.isGM
          ? canvas.tokens.controlled
          : canvas.tokens.placeables.filter(t => (obs ? t.observer : t.owner))
      ).reduce((a, t) => a || inSensorRange(t, this), false);
      return s || vis;
    }
  );
});

function inSensorRange(observer, target) {
  const sensors = observer.actor.data.data.derived?.mm?.SensorRange;
  const o_spaces = observer.getOccupiedSpaces();
  const t_spaces = target.getOccupiedSpaces();
  // On gridless, so just use center.
  if (!o_spaces.length) o_spaces.push(observer.center);
  if (!t_spaces.length) o_spaces.push(target.center);
  const rays = o_spaces.flatMap(p1 =>
    t_spaces.map(p2 => ({ ray: new Ray(p1, p2) }))
  );
  const min_d = Math.min(
    ...canvas.grid.grid.measureDistances(rays, { gridSpaces: true })
  );
  return sensors >= min_d;
}
