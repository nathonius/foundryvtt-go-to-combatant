import { libWrapper } from "./shim.js";

Hooks.once("init", () => {
  libWrapper.register(
    "go-to-combatant",
    "CombatTracker.prototype._onCombatantMouseDown",
    new_onCombatantMouseDown,
    "OVERRIDE"
  );
});

function getGame(): Game {
  if (!(game instanceof Game)) {
    throw new Error("game is not initialized yet!");
  }
  return game;
}

function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas)) {
    throw new Error("canvas is not initialized yet!");
  }
  return canvas;
}

async function new_onCombatantMouseDown(
  this: CombatTracker & { _clickTime: number },
  event: MouseEvent
) {
  event.preventDefault();

  const li = event.currentTarget as HTMLLIElement;
  const combatant = this.viewed!.combatants.get(
    li.dataset.combatantId!
  ) as Combatant;
  const token = combatant.token;
  if (
    !combatant.actor?.testUserPermission(
      getGame().user!,
      CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
    )
  ) {
    return;
  }
  const now = Date.now();

  // Handle double-left click to open sheet
  const dt = now - this._clickTime;
  this._clickTime = now;
  if (dt <= 250) return combatant.actor?.sheet!.render(true);

  // Navigate to scene if it's not the current scene
  if ((combatant as any).sceneId !== getGame().scenes!.viewed!.id) {
    const scene = getGame().scenes!.get((combatant as any).sceneId);
    if (scene) {
      await scene.view();
    }
  }

  // Control and pan to Token object
  if (token?.object) {
    token.object?.control({ releaseOthers: true });
    return getCanvas().animatePan(token.object.center);
  }
}
