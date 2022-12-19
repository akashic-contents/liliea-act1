import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "waiting" | "dead" | "alive";

export class DeadEventEntity extends EventEntity {
	private _currentCut: Cut = "dead";
	private _timeline: Timeline;
	private _effectLayer: g.E;
	private _emotion: g.Sprite | null = null;
	private _bombEffect: g.FrameSprite | null = null;
	private _fallingOffset: g.CommonOffset;
	private _followerId: string;

	constructor(param: EventEntityParameterObject) {
		super(param);
		const scene = param.scene;
		this._timeline = new Timeline(scene);

		this._effectLayer = new g.E({ scene });
		this.field.appendTopLayer(this._effectLayer);

		this.onUpdate.add(this.onUpdateForEvent, this);
	}

	shouldGameStopped(): boolean {
		return false;
	}

	onUpdateForEvent(): void {
		switch (this._currentCut) {
			case "waiting":
				break;
			case "dead":
				this.dead();
				break;
			case "alive":
				this.alive();
				break;
			default:
				break;
		}
	}

	dead(): void {
		const scene = this.scene;

		// 爆発:
		const bombEffect = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("effect_fancy"),
			anchorX: 0.5,
			anchorY: 0.5,
			width: 128,
			height: 128,
			frames: [0, 1, 2, 3, 4, 5],
			loop: false
		});
		bombEffect.start();
		this.field.playerEntity.frameSprite.append(bombEffect);

		this._timeline.create(this.field).moveBy(10, 10, 100).moveBy(-20, -20, 100).moveBy(15, 15, 100).moveBy(-5, -5, 100);

		this._timeline
			.create(this.field.playerEntity.frameSprite)
			.rotateTo(135, 100)
			.wait(200)
			.call(() => bombEffect.hide())
			.wait(500)
			.moveBy(0, -32, 500, Easing.easeOutCubic)
			.moveBy(0, +32, 500, Easing.easeInCubic);

		scene.setTimeout(() => {
			bombEffect.destroy();
			this._currentCut = "alive";
		}, 2000);
		this._currentCut = "waiting";
	}

	alive(): void {
		this._timeline.create(this.field.playerEntity.frameSprite).wait(2000).rotateTo(360, 300);

		this.scene.setTimeout(() => {
			this.onFinished();
			this._timeline.clear();
			this.field.playerEntity.recoverHp(this.field.playerEntity.maxHP);
		}, 2500);
		this._currentCut = "waiting";
	}
}
