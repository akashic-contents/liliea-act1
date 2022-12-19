import { ScoreBoardEntity } from "../entities/ScoreBoardEntity";
import { recreateGameFieldScene } from "../main";
import { Score } from "../types/Score";

export interface GameResultSceneParameterObject extends g.SceneParameterObject {
	score: Score;
	canReplay: boolean;
}

// ゲーム結果を表示するシーン
export class GameResultScene extends g.Scene {
	private _scoreBoardEntity: ScoreBoardEntity;
	constructor(param: GameResultSceneParameterObject) {
		super(param);
		console.log("score:", param.score);
		this.onLoad.add(() => {
			this._initialize(param);
		});
	}

	private _initialize(param: GameResultSceneParameterObject): void {
		this._scoreBoardEntity = new ScoreBoardEntity({
			scene: this,
			score: param.score,
			onFinish: () => {
				if (param.canReplay) {
					const scene = recreateGameFieldScene(false);
					if (scene) {
						g.game.replaceScene(scene);
					}
				}
			}
		});
		this.append(this._scoreBoardEntity);
	}
}
