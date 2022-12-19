import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { characterDataTable, itemDataTable } from "../../global/dataTable";
import { FieldEntity } from "../FieldEntity";
import { FollowerEntity } from "../FollowerEntity";
import { createItemEntity, FollowerItemEntity } from "../ItemEntity";
import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "waiting" | "demo" | "end";

const FALL_RADIUS_X = 240;
const FALL_RADIUS_Y = 180;

export class SimplifyFollowerFallingEventEntity extends EventEntity {
	private _currentCut: Cut = "demo";
	private _timeline: Timeline;
	private _effectLayer: g.E;
	private _fallingOffset: g.CommonOffset;
	private _fallingStarEffect: g.Sprite | null = null;
	private _bombEffect: g.FrameSprite | null = null;
	private _followerId: string;

	constructor(param: EventEntityParameterObject) {
		super(param);
		const scene = param.scene;
		this._timeline = new Timeline(scene);

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
		return false;
	}

	onUpdateForEvent(): void {
		switch (this._currentCut) {
			case "waiting":
				break;
			case "demo":
				this.demo();
				break;
			case "end":
				this.end();
				break;
			default:
				break;
		}
	}

	begin(): void {
		this.scene.setTimeout(() => {
			this._currentCut = "demo";
		}, 1);
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
			anchorY: 0.5
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
			this._currentCut = "end";
		}, 2000);
		this._currentCut = "waiting";
	}

	end(): void {
		this.scene.setTimeout(() => {
			this.onFinished();

			if (this._bombEffect) {
				this._bombEffect.hide();
				this._bombEffect.destroy();
			}
			if (this._effectLayer) {
				this._effectLayer.hide();
				this._effectLayer.destroy();
			}
			this._timeline.clear();
		}, 1);
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
