import { DEFAULT_ANIMATION_INTERVAL, GAME_HEIGHT, GAME_WIDTH } from "../config";
import { CharacterEntityParameterObject, CharacterEntity } from "./CharacterEntity";

export interface BossEntityParameterObject extends CharacterEntityParameterObject {}

export class BossEntity extends CharacterEntity {
	constructor(param: BossEntityParameterObject) {
		super(param);
	}

	createFrameSprite(param: CharacterEntityParameterObject): g.FrameSprite {
		const boss = new g.FrameSprite({
			scene: param.scene,
			src: param.src,
			width: param.width,
			height: param.height,
			x: param.x ?? GAME_WIDTH / 2,
			y: param.y ?? GAME_HEIGHT / 2,
			anchorX: 0.5,
			anchorY: 0.5,
			frames: param.frames ?? [0, 1, 2, 3],
			interval: param.interval ?? DEFAULT_ANIMATION_INTERVAL,
			touchable: param.touchable ?? false
		});
		const effect = new g.FrameSprite({
			scene: param.scene,
			src: param.scene.asset.getImageById("boss2e"),
			width: param.width,
			height: param.height,
			x: param.width / 2,
			y: param.height / 2 + 16,
			anchorX: 0.5,
			anchorY: 0.5,
			opacity: 0.5,
			frames: param.frames ?? [0, 1, 2, 3],
			interval: 60,
			touchable: param.touchable ?? false,
			compositeOperation: "lighter"
		});
		effect.start();
		boss.start();
		boss.append(effect);
		return boss;
	}

	updateDirectionAfterMoved(dx: number, dy: number): void {
		// アニメーションフレームは変更しない:
		const beforeFrames = this.frameSprite.frames;
		super.updateDirectionAfterMoved(dx, dy);
		this.frameSprite.frames = beforeFrames;
		this.frameSprite.modified();
	}
}
