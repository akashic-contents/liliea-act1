import { ScoreBoardEntity } from "../entities/ScoreBoardEntity";
import { recreateGameFieldScene } from "../main";
import { Score } from "../types/Score";
import { MusicPlayer } from "../util/MusicPlayer";

export interface GameResultSceneParameterObject extends g.SceneParameterObject {
	score: Score;
	canReplay: boolean;
}

// ゲーム結果を表示するシーン
export class GameResultScene extends g.Scene {
	private _scoreBoardEntity: ScoreBoardEntity;
	private _musicPlayer: MusicPlayer;

	constructor(param: GameResultSceneParameterObject) {
		super(param);
		this.onLoad.add(() => {
			this._initialize(param);
		});
	}

	private _initialize(param: GameResultSceneParameterObject): void {
		this.setupAudio();
		this._musicPlayer.play("nc150061");

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
				this._musicPlayer.stopAll();
			}
		});
		this.append(this._scoreBoardEntity);
	}

	setupAudio(): void {
		this._musicPlayer = new MusicPlayer(this);
		g.game.audio.sound.volume = 0.5;
		g.game.audio.music.volume = 0.5;
	}
}
