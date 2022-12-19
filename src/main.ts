import { GameMainParameterObject } from "./parameterObject";
import { GameFieldScene } from "./scene/GameFieldScene";
import { GameResultScene } from "./scene/GameResultScene";
import { Score } from "./types/Score";

// !! For Debug:
const useHime = false;
const totalGameEventTime = 30;

let firstGameMainParameter: GameMainParameterObject | null = null;

export function main(param: GameMainParameterObject): void {
	console.log("sessionParameter:", param.sessionParameter);

	g.game.vars.gameState = { score: 0 };

	firstGameMainParameter = param;

	const scene = createGameFieldScene(param, useHime);

	g.game.pushScene(scene);
}

export function recreateGameFieldScene(useHime: boolean): g.Scene | null {
	if (firstGameMainParameter) {
		return createGameFieldScene(firstGameMainParameter, useHime);
	} else {
		return null;
	}
}

export function createGameFieldScene(param: GameMainParameterObject, useHime: boolean): g.Scene {
	const timeLimit = param.sessionParameter?.totalTimeLimit;
	const isRankingMode = param.sessionParameter?.mode === "ranking";

	g.game.vars.gameState = { score: 0 };

	return new GameFieldScene({
		game: g.game,
		assetPaths: ["/**/*"],
		stageId: isRankingMode ? "stage1_ranking" : "stage1_single",
		playableCharacterId: useHime ? "hime" : "dog",
		timeLimit: timeLimit > totalGameEventTime ? timeLimit - totalGameEventTime : null,
		initialWeaponId: useHime ? "sword" : "shot",
		onFinish: (score: Score) => {
			const resultScene = new GameResultScene({
				game: g.game,
				assetPaths: ["/**/*"],
				score,
				canReplay: !isRankingMode
			});
			g.game.replaceScene(resultScene);
		}
	});
}
