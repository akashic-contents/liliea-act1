import { Timeline, Tween, Easing } from "@akashic-extension/akashic-timeline";
import { DEFAULT_ANIMATION_INTERVAL, GAME_HEIGHT, GAME_WIDTH } from "../../config";
import { characterDataTable } from "../../global/dataTable";
import { RIGHT_MOVING, LEFT_MOVING } from "../CharacterEntity";
import { PlayableCharacterEntity } from "../PlayableCharacterEntity";
import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "waiting" | "fadein" | "demo" | "fadeout" | "skip";

export class OpeningEventEntity extends EventEntity {
	private _currentCut: Cut = "fadein";
	private _timeline: Timeline;
	private _fullFilled: g.FilledRect | null = null;
	private _topFilled: g.FilledRect | null = null;
	private _underFilled: g.FilledRect | null = null;

	private _liliea: g.FrameSprite;
	private _lilieaFace: g.FrameSprite;
	private _hime: g.FrameSprite;
	private _himeFace: g.FrameSprite;
	private _majyo: g.FrameSprite;
	private _majyoFace: g.FrameSprite;

	private _skipButton: g.Sprite;
	private _himeButton: g.FilledRect;
	private _enabledHimeButton: boolean = true;

	private _characterLayer: g.E;
	private _faceLayer: g.E;
	private _filledLayer: g.E;

	constructor(param: EventEntityParameterObject) {
		super(param);
		const scene = param.scene;
		this._timeline = new Timeline(scene);

		this._characterLayer = new g.E({ scene });
		this.field.appendTopLayer(this._characterLayer);

		this._filledLayer = new g.E({ scene });
		this.field.appendTopLayer(this._filledLayer);

		this._faceLayer = new g.E({ scene });
		this.field.appendTopLayer(this._faceLayer);

		this.onUpdate.add(this.onUpdateForEvent, this);
	}

	shouldGameStopped(): boolean {
		return true;
	}

	onUpdateForEvent(): void {
		switch (this._currentCut) {
			case "waiting":
				break;
			case "fadein":
				this.fadeIn();
				break;
			case "demo":
				this.demo();
				break;
			case "fadeout":
				this.fadeOut();
				break;
			case "skip":
				this.skip();
				break;
			default:
				break;
		}
	}

	showFieldCharacter(): void {
		this.field.playerEntity.show();
		this.field.followerEntities.forEach(e => e.show());
	}

	hideFieldCharacter(): void {
		this.field.playerEntity.hide();
		this.field.followerEntities.forEach(e => e.hide());
	}

	createSkipButton(skipFn: () => void): void {
		const scene = this.scene;
		this._skipButton = new g.Sprite({
			scene,
			src: scene.asset.getImageById("skip"),
			x: this.field.viewOffset.x + g.game.width - 192,
			y: this.field.viewOffset.y + 140,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 0.5,
			scaleY: 0.5,
			touchable: true
		});
		this._skipButton.onPointDown.add(skipFn);
		this._timeline
			.create(this._skipButton, { loop: true })
			.scaleTo(0.4, 0.4, 3000, Easing.easeInCubic)
			.scaleTo(0.5, 0.5, 3000, Easing.easeOutCubic);
		this._filledLayer.append(this._skipButton);
	}

	createHimeButton(himeFn: () => void): void {
		const scene = this.scene;
		this._himeButton = new g.FilledRect({
			scene,
			x: this.field.viewOffset.x + g.game.width - 192,
			y: this.field.viewOffset.y + g.game.height - 140,
			cssColor: "#080808",
			width: 64,
			height: 64,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 0.5,
			scaleY: 0.5,
			touchable: true
		});
		this._himeButton.onPointDown.add(himeFn);
		this._timeline
			.create(this._himeButton, { loop: true })
			.scaleTo(0.4, 0.4, 3000, Easing.easeInCubic)
			.scaleTo(0.5, 0.5, 3000, Easing.easeOutCubic);
		this._filledLayer.append(this._himeButton);
	}

	createCharacters(): void {
		const scene = this.scene;
		this._liliea = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("character3"),
			x: this.field.viewOffset.x + g.game.width / 2 + 32,
			y: this.field.viewOffset.y + g.game.height / 2,
			anchorX: 0.5,
			anchorY: 0.5,
			width: 32,
			height: 32,
			interval: DEFAULT_ANIMATION_INTERVAL,
			frames: LEFT_MOVING
		});
		this._liliea.start();
		this._characterLayer.append(this._liliea);

		this._hime = this.createHime({
			x: this.field.viewOffset.x + g.game.width / 2,
			y: this.field.viewOffset.y + g.game.height / 2
		});
		this._hime.start();
		this._characterLayer.append(this._hime);

		this._majyo = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("boss2"),
			x: this.field.viewOffset.x + g.game.width / 2 + 352,
			y: this.field.viewOffset.y + g.game.height / 2 - 16,
			anchorX: 0.5,
			anchorY: 0.5,
			width: 128,
			height: 128,
			interval: DEFAULT_ANIMATION_INTERVAL,
			frames: [0, 1, 2, 3]
		});
		this._majyo.append(
			new g.FrameSprite({
				scene,
				src: scene.asset.getImageById("character9"),
				anchorX: 0.5,
				anchorY: 0.5,
				x: 64,
				y: 50,
				width: 32,
				height: 32,
				interval: DEFAULT_ANIMATION_INTERVAL,
				frames: LEFT_MOVING
			})
		);
		this._majyo.start();
		this._characterLayer.append(this._majyo);
	}

	createHime(offset: g.CommonOffset): g.FrameSprite {
		const scene = this.scene;
		return new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("character10"),
			...offset,
			anchorX: 0.5,
			anchorY: 0.5,
			width: 32,
			height: 32,
			interval: DEFAULT_ANIMATION_INTERVAL,
			frames: RIGHT_MOVING
		});
	}

	createFaces(): void {
		const scene = this.scene;
		this._lilieaFace = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("face_liliea"),
			x: this.field.viewOffset.x + g.game.width / 2 + 80,
			y: this.field.viewOffset.y + g.game.height / 2 + 72,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 0.5,
			scaleY: 0.5,
			opacity: 0,
			width: 160,
			height: 160,
			interval: DEFAULT_ANIMATION_INTERVAL * 10,
			frames: [0, 1]
		});
		this._lilieaFace.start();
		this._faceLayer.append(this._lilieaFace);

		this._himeFace = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("face_hime"),
			x: this.field.viewOffset.x + g.game.width / 2 - 60,
			y: this.field.viewOffset.y + g.game.height / 2 + 72,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 0.5,
			scaleY: 0.5,
			opacity: 0,
			width: 160,
			height: 160,
			interval: DEFAULT_ANIMATION_INTERVAL * 10,
			frames: [0]
		});
		this._himeFace.start();
		this._faceLayer.append(this._himeFace);

		this._majyoFace = new g.FrameSprite({
			scene,
			src: scene.asset.getImageById("face_majyo"),
			x: this.field.viewOffset.x + g.game.width / 2 + 320,
			y: this.field.viewOffset.y + g.game.height / 2 + 72,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 0.5,
			scaleY: 0.5,
			opacity: 0,
			width: 160,
			height: 160,
			interval: DEFAULT_ANIMATION_INTERVAL,
			frames: [0]
		});
		this._majyoFace.start();
		this._faceLayer.append(this._majyoFace);
	}

	fadeIn(): void {
		const scene = this.scene;

		// フィールドのキャラクターを消す:
		this.hideFieldCharacter();

		// Fade IN/OUT 領域:
		this._fullFilled = new g.FilledRect({
			scene,
			x: this.field.viewOffset.x,
			y: this.field.viewOffset.y,
			width: GAME_WIDTH,
			height: GAME_HEIGHT,
			cssColor: "black"
		});
		this._filledLayer.append(this._fullFilled);

		this._topFilled = new g.FilledRect({
			scene,
			x: this.field.viewOffset.x,
			y: this.field.viewOffset.y,
			width: GAME_WIDTH,
			height: 160,
			cssColor: "black"
		});
		this._filledLayer.append(this._topFilled);

		this._underFilled = new g.FilledRect({
			scene,
			x: this.field.viewOffset.x,
			y: this.field.viewOffset.y + 320,
			width: GAME_WIDTH,
			height: 160,
			cssColor: "black"
		});
		this._filledLayer.append(this._underFilled);

		this.createCharacters();
		this.createFaces();

		// のんびりしてる2名:
		this._timeline
			.create(this._fullFilled)
			.fadeOut(2000, Easing.easeInOutCubic)
			.con()
			.wait(1000)
			.call(() => {
				this.createSkipButton(() => {
					if (this._currentCut !== "skip" && this._currentCut !== "fadeout") {
						this._currentCut = "skip";
					}
				});
				this.createHimeButton(() => {
					if (!this._enabledHimeButton) {
						return;
					}
					if (this._currentCut !== "skip" && this._currentCut !== "fadeout") {
						const bombEffect = new g.FrameSprite({
							scene: this.scene,
							src: this.scene.asset.getImageById("effect_fancy"),
							x: 32,
							y: 32,
							anchorX: 0.5,
							anchorY: 0.5,
							width: 128,
							height: 128,
							frames: [0, 1, 2, 3, 4, 5],
							loop: false,
							opacity: 0.6
						});
						bombEffect.start();
						this._himeButton.append(bombEffect);
						this.field.updatePlayerEntity(this.createHimePlayerEntity(this.scene, g.game.selfId));
						this._enabledHimeButton = false;
					}
				});
			});

		this._timeline.create(this._topFilled).wait(3000);
		this._timeline.create(this._underFilled).wait(3000);
		this._timeline
			.create(this.field)
			.scaleTo(2, 2, 2000, Easing.easeInOutCubic)
			.con()
			.moveBy(-this.field.viewOffset.x - GAME_WIDTH / 2, -this.field.viewOffset.y - GAME_HEIGHT / 2, 2000, Easing.easeInOutCubic);

		this._timeline
			.create(this._liliea)
			.wait(2000)
			.moveBy(0, -16, 200, Easing.easeOutCubic)
			.moveBy(0, 16, 200, Easing.easeInCubic)
			.wait(500)
			.moveBy(0, -16, 200, Easing.easeOutCubic)
			.moveBy(0, 16, 200, Easing.easeInCubic)
			.wait(2000);

		this._timeline.create(this._lilieaFace).wait(2000).fadeIn(200, Easing.easeOutCubic).wait(2000).fadeOut(200, Easing.easeInCubic);
		this._timeline.create(this._himeFace).wait(2000).fadeIn(200, Easing.easeOutCubic).wait(2000).fadeOut(200, Easing.easeInCubic);

		this.scene.setTimeout(() => {
			this._currentCut = "demo";
		}, 5500);
		this._currentCut = "waiting";
	}

	demo(): void {
		// リリア轢かれる:
		let rotationLoop: Tween | null = null;
		let bombEffect: g.FrameSprite | null = null;
		this._timeline
			.create(this._liliea)
			.wait(200)
			.call(() => {
				rotationLoop = this._timeline.create(this._liliea, { loop: true }).every((e: number, i: number) => {
					this._liliea.angle += 30;
					this._liliea.x += 12;
				}, 500);

				// ひかれた爆発
				bombEffect = new g.FrameSprite({
					scene: this.scene,
					src: this.scene.asset.getImageById("effect_fancy"),
					x: this._liliea.x,
					y: this._liliea.y,
					anchorX: 0.5,
					anchorY: 0.5,
					width: 128,
					height: 128,
					frames: [0, 1, 2, 3, 4, 5],
					loop: false,
					opacity: 0.6
				});
				bombEffect.start();
				this._characterLayer.append(bombEffect);
			})
			.moveBy(0, -48, 500, Easing.easeOutCubic)
			.moveBy(0, 48, 500, Easing.easeInCubic)
			.moveBy(0, -4, 200, Easing.easeOutCubic)
			.moveBy(0, 4, 200, Easing.easeInCubic)
			.call(() => {
				rotationLoop.cancel();
				bombEffect.hide();
				bombEffect.destroy();
			})
			.rotateTo(135, 100)
			.wait(2000)
			.rotateTo(0, 100)
			.wait(1000)
			.rotateTo(0, 100)
			.moveBy(-64, 0, 200)
			.moveBy(0, -32, 200, Easing.easeOutCubic)
			.moveBy(0, 32, 200, Easing.easeInCubic)
			.wait(100)
			.moveBy(0, -32, 200, Easing.easeOutCubic)
			.moveBy(0, 32, 200, Easing.easeInCubic);

		this._timeline
			.create(this._hime)
			.wait(600)
			.call(() => {
				this._hime.hide();
				this._hime.destroy();
				this._hime = this.createHime({ x: 84, y: 56 });
				this._majyo.append(this._hime);
			});

		// ヒメさらわれる:
		let emotion: g.FrameSprite | null = null;
		this._timeline.create(this._majyo).moveBy(-384, 0, 500, Easing.easeOutCubic).wait(4000).moveBy(-416, 0, 500, Easing.easeInCubic);
		this._timeline
			.create(this._majyoFace)
			.wait(400)
			.fadeIn(200, Easing.easeOutCubic)
			.moveBy(-416, 0, 500, Easing.easeOutCubic)
			.call(() => {
				// 魔女笑エモーション
				emotion = new g.FrameSprite({
					scene: this.scene,
					src: this.scene.asset.getImageById("emotions"),
					x: 160,
					y: 80,
					width: 32,
					height: 32,
					srcWidth: 32,
					srcHeight: 32,
					frames: [2, 3],
					interval: DEFAULT_ANIMATION_INTERVAL
				});
				emotion.start();
				this._majyoFace.append(emotion);
			})
			.wait(1500)
			.call(() => {
				emotion.hide();
				emotion.destroy();
			})
			.wait(500)
			.call(() => {
				this._majyoFace.frames = [1];
			})
			.wait(900)
			.moveBy(-448, 0, 500, Easing.easeInCubic);

		this._timeline
			.create(this._himeFace)
			.moveBy(32, 0, 1)
			.wait(3000)
			.call(() => {
				this._himeFace.frames = [1];
			})
			.fadeIn(200, Easing.easeOutCubic)
			.wait(800)
			.moveBy(-416, 0, 500, Easing.easeInCubic)
			.fadeOut(1);

		this.scene.setTimeout(() => {
			this._currentCut = "fadeout";
		}, 5000);
		this._currentCut = "waiting";
	}

	skip(): void {
		this._himeButton.hide();
		this._skipButton.hide();
		this._timeline.completeAll();
		this.scene.setTimeout(() => {
			this._currentCut = "fadeout";
		}, 1);
		this._currentCut = "waiting";
	}

	fadeOut(): void {
		this._himeButton.hide();
		this._skipButton.hide();
		this._timeline.create(this._topFilled).moveBy(0, -240, 2000, Easing.easeInOutCubic).fadeOut(0);
		this._timeline.create(this._underFilled).moveBy(0, 240, 2000, Easing.easeInOutCubic).fadeOut(0);
		this._timeline
			.create(this.field)
			.scaleTo(1, 1, 2000, Easing.easeInOutCubic)
			.con()
			.moveBy(this.field.viewOffset.x + GAME_WIDTH / 2, this.field.viewOffset.y + GAME_HEIGHT / 2, 2000, Easing.easeInOutCubic);

		this.scene.setTimeout(() => {
			this.onFinished();

			// フィールドのキャラクターを表示:
			this.showFieldCharacter();

			this._filledLayer.hide();
			this._filledLayer.destroy();
			this._characterLayer.hide();
			this._characterLayer.destroy();
			this._faceLayer.hide();
			this._faceLayer.destroy();
			this._timeline.clear();
		}, 2000);
		this._currentCut = "waiting";
	}

	createHimePlayerEntity(scene: g.Scene, playerId: string): PlayableCharacterEntity {
		const character = characterDataTable.get("hime");
		const playerEntity = new PlayableCharacterEntity({
			scene,
			src: scene.asset.getImageById(character.assetId),
			width: 32,
			height: 32,
			data: character,
			playerId,
			weaponIds: ["sword"]
		});
		playerEntity.hide();
		return playerEntity;
	}
}
