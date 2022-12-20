import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { characterDataTable, itemDataTable } from "../../global/dataTable";
import { FieldEntity } from "../FieldEntity";
import { FollowerEntity } from "../FollowerEntity";
import { createItemEntity, FollowerItemEntity } from "../ItemEntity";
import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "waiting" | "zoomout" | "demo" | "zoomin";

const FALL_RADIUS_X = 320;
const FALL_RADIUS_Y = 240;

export class FollowerFallingEventEntity extends EventEntity {
	private _currentCut: Cut = "zoomout";
	private _timeline: Timeline;
	private _effectLayer: g.E;
	private _fallingStarEffect: g.Sprite | null = null;
	private _emotion: g.Sprite | null = null;
	private _bombEffect: g.FrameSprite | null = null;
	private _fallingOffset: g.CommonOffset;
	private _oldOffset: g.CommonOffset;
	private _oldTilePosition: g.CommonOffset;
	private _oldFieldPosition: g.CommonOffset;
	private _followerId: string;

	constructor(param: EventEntityParameterObject) {
		super(param);
		const scene = param.scene;
		this._timeline = new Timeline(scene);

		this._oldOffset = this.field.viewOffset;
		this._oldTilePosition = this.field.tilePosition;
		this._oldFieldPosition = { x: this.field.x, y: this.field.y };

		this._effectLayer = new g.E({ scene });
		this.field.appendTopLayer(this._effectLayer);

		// TODO: マルチプレイ化
		const isLocal = false;
		const x = isLocal ? g.game.localRandom.generate() : g.game.random.generate() * FALL_RADIUS_X - 120;
		const y = isLocal ? g.game.localRandom.generate() : g.game.random.generate() * FALL_RADIUS_Y - 120;
		console.log("fallingRadius:", x, y);

		// フィールド範囲内に補正:
		this._fallingOffset = {
			x: Math.max(64, Math.min(-x + this.field.viewOffset.x + g.game.width / 2, this.field.area.width - 64)),
			y: Math.max(64, Math.min(-y + this.field.viewOffset.y + g.game.height / 2, this.field.area.height - 64))
		};

		const followerIds = ["followerFire", "followerCold", "followerThunder", "followerSpace"];
		this._followerId = followerIds[Math.floor(isLocal ? g.game.localRandom.generate() : g.game.random.generate() * followerIds.length)];
		console.log("falling star offset:", this._fallingOffset, this.field.viewOffset);
		this.onUpdate.add(this.onUpdateForEvent, this);
	}

	shouldGameStopped(): boolean {
		return true;
	}

	onUpdateForEvent(): void {
		switch (this._currentCut) {
			case "waiting":
				break;
			case "zoomout":
				this.zoomOut();
				break;
			case "demo":
				this.demo();
				break;
			case "zoomin":
				this.zoomIn();
				break;
			default:
				break;
		}
	}

	zoomOut(): void {
		const scene = this.scene;

		// 漫符: おどろき
		this._emotion = new g.Sprite({
			scene,
			src: scene.asset.getImageById("emotions"),
			x: 24,
			y: -18,
			width: 32,
			height: 32,
			srcWidth: 32,
			srcHeight: 32,
			anchorX: 0.5,
			anchorY: 0.5
		});
		this.field.playerEntity.frameSprite.append(this._emotion);
		this._timeline.create(this._emotion).moveBy(0, 16, 50, Easing.easeOutCubic).moveBy(0, -16, 50, Easing.easeInCubic);

		// カメラ引き
		const camera = { x: this._fallingOffset.x / 2 - g.game.width / 4, y: this._fallingOffset.y / 2 - g.game.height / 4 };
		console.log("old field, offset, and tile:", this._oldFieldPosition, this._oldOffset, this._oldTilePosition);
		console.log("falling star camera:", camera);

		this._timeline
			.create(this.field)
			.wait(100)
			.moveTo(
				-camera.x - this._oldTilePosition.x / 2 + 160,
				-camera.y - this._oldTilePosition.y / 2 + 120,
				900,
				Easing.easeInOutCubic
			)
			.con()
			.scaleTo(0.5, 0.5, 900, Easing.easeInOutCubic);

		this.scene.setTimeout(() => {
			this._currentCut = "demo";
		}, 1000);
		this._currentCut = "waiting";
	}

	demo(): void {
		// 空から友達が！
		this._fallingStarEffect = new g.Sprite({
			scene: this.scene,
			src: this.scene.asset.getImageById("star"),
			x: this._fallingOffset.x + 640,
			y: this._fallingOffset.y - 480,
			anchorX: 0.5,
			anchorY: 0.5,
			scaleX: 3,
			scaleY: 3
		});
		this._effectLayer.append(this._fallingStarEffect);
		this._timeline
			.create(this._fallingStarEffect)
			.moveBy(-640, 480, 1000, Easing.easeInOutCubic)
			.con()
			.scaleTo(1, 1, 1000, Easing.easeInOutCubic)
			.con()
			.every(() => (this._fallingStarEffect.angle += 45), 1000)
			.call(() => {
				// 爆発:
				this.musicPlayer.play("nc107871");

				this._bombEffect = new g.FrameSprite({
					scene: this.scene,
					src: this.scene.asset.getImageById("effect_fancy"),
					...this._fallingOffset,
					anchorX: 0.5,
					anchorY: 0.5,
					width: 128,
					height: 128,
					frames: [0, 1, 2, 3, 4, 5],
					loop: true
				});
				this._bombEffect.start();
				this._timeline.create(this._bombEffect).scaleTo(2, 2, 2000, Easing.easeOutCubic).fadeOut(2000, Easing.easeOutCubic);
				this._effectLayer.append(this._bombEffect);
			});

		this._timeline
			.create(this.field)
			.wait(1000)
			.moveBy(10, 10, 100)
			.moveBy(-20, -20, 100)
			.moveBy(15, 15, 100)
			.moveBy(-5, -5, 100)
			.call(() => {
				this.createFollowerItem(this._followerId, this._fallingOffset);
			});

		this.scene.setTimeout(() => {
			this._currentCut = "zoomin";
		}, 2000);
		this._currentCut = "waiting";
	}

	zoomIn(): void {
		this._timeline
			.create(this.field)
			.scaleTo(1, 1, 1000, Easing.easeInOutCubic)
			.con()
			.moveTo(this._oldFieldPosition.x, this._oldFieldPosition.y, 1000, Easing.easeInOutCubic)
			.call(() => {
				this.field.updateViewOffset(this._oldOffset, this._oldTilePosition);
				console.log("new offset and tile:", this._oldFieldPosition, this.field.viewOffset, this.field.tilePosition);
			});

		this.scene.setTimeout(() => {
			this.onFinished();

			if (this._emotion) {
				this._emotion.hide();
				this._emotion.destroy();
			}
			if (this._bombEffect) {
				this._bombEffect.hide();
				this._bombEffect.destroy();
			}
			if (this._effectLayer) {
				this._effectLayer.hide();
				this._effectLayer.destroy();
			}
			this._timeline.clear();
		}, 1050);
		this._currentCut = "waiting";
	}

	createFollowerItem(id: string, offset: g.CommonOffset): void {
		const item = itemDataTable.get(id);
		const entity = createItemEntity({
			scene: this.scene,
			src: this.scene.asset.getImageById(item.assetId),
			data: item
		});
		const scene = this.scene;
		const field = this.field;
		const func = (): void => {
			const id = (entity as FollowerItemEntity).characterId;
			const follower = createFollower(scene, field, id);
			field.registerFollower(follower);
		};
		this.field.registerItem(entity, offset, func);
	}
}

export function createFollower(scene: g.Scene, field: FieldEntity, characterId: string): FollowerEntity {
	const follower = characterDataTable.get(characterId);
	const player = field.playerEntity;
	const entity = new FollowerEntity({
		scene,
		src: scene.asset.getImageById(follower.assetId),
		width: 32,
		height: 32,
		data: follower,
		followee: player,
		numOrdinal: field.followerEntities.length,
		weaponIds: follower.weaponIds ?? []
	});
	entity.move(player.offset.x - g.game.width / 2, player.offset.y - g.game.height / 2);
	return entity;
}
