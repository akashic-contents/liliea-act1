import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { characterDataTable, itemDataTable } from "../../global/dataTable";
import { FieldEntity } from "../FieldEntity";
import { FollowerEntity } from "../FollowerEntity";
import { createItemEntity, FollowerItemEntity } from "../ItemEntity";
import { EventEntity, EventEntityParameterObject } from "./EventEntity";

type Cut = "waiting" | "zoomout" | "demo" | "zoomin";

const FALL_RADIUS_X = 240;
const FALL_RADIUS_Y = 240;

export class DebugEventEntity extends EventEntity {
	private _currentCut: Cut = "zoomout";
	private _timeline: Timeline;
	private _fullFilled: g.FilledRect | null = null;
	private _effectLayer: g.E;
	private _fallingStarEffect: g.Sprite | null = null;
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
		const x = isLocal ? g.game.localRandom.generate() : g.game.random.generate() * FALL_RADIUS_X;
		const y = isLocal ? g.game.localRandom.generate() : g.game.random.generate() * FALL_RADIUS_Y;
		this._fallingOffset = {
			// x: x + this.field.viewOffset.x - g.game.width / 2,
			// y: y + this.field.viewOffset.y - g.game.height / 2
			x: x + this.field.viewOffset.x - g.game.width / 2,
			y: y + this.field.viewOffset.y - g.game.height / 2
		};

		const followerIds = ["followerFire", "followerCold", "followerThunder", "followerSpace"];
		this._followerId = followerIds[Math.floor(isLocal ? g.game.localRandom.generate() : g.game.random.generate() * followerIds.length)];

		// this._effectLayer.append(
		// 	new g.FilledRect({
		// 		scene: this.scene,
		// 		cssColor: "blue",
		// 		...this._fallingOffset,
		// 		width: 160,
		// 		height: 160,
		// 		anchorX: 0.5,
		// 		anchorY: 0.5
		// 	})
		// );
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
			case "zoomin":
				this.zoomIn();
				break;
			default:
				break;
		}
	}

	zoomOut(): void {
		const camera = { x: this._fallingOffset.x / 2 - g.game.width / 4, y: this._fallingOffset.y / 2 - g.game.height / 4 };
		// const camera = { x: -this._fallingOffset.x * 0.5 + g.game.width / 2, y: -this._fallingOffset.y * 0.5 - g.game.height / 2 };
		// const diff = {
		//    x: camera.x - (this._oldFieldPosition.x + this._fallingOffset.x) * 0.5,
		//    y: camera.y - (this._oldFieldPosition.y + this._fallingOffset.y) * 0.5
		// };
		console.log("old field, offset, and tile:", this._oldFieldPosition, this._oldOffset, this._oldTilePosition);
		console.log("falling star camera:", camera);

		this._timeline
			.create(this.field)
			// .call(() => {
			//    this.field.moveViewOffset(camera.x - this._oldOffset.x, camera.y - this._oldOffset.y);
			// })
			.moveTo(-camera.x - this._oldTilePosition.x / 2, -camera.y - this._oldTilePosition.y / 2, 1000, Easing.easeInOutCubic)
			// .con()
			.scaleTo(0.5, 0.5, 1000, Easing.easeInOutCubic);

		this.scene.setTimeout(() => {
			this._currentCut = "zoomin";
		}, 1000);
		this._currentCut = "waiting";
	}

	zoomIn(): void {
		// this._timeline
		//	.create(this.field)
		//	.scaleTo(1, 1, 1000, Easing.easeInOutCubic)
		//	.con()
		//	.moveTo(this._oldFieldPosition.x, this._oldFieldPosition.y, 1000, Easing.easeInOutCubic)
		//	.call(() => {
		//		this.field.updateViewOffset(this._oldOffset, this._oldTilePosition);
		//		console.log("new offset and tile:", this._oldFieldPosition, this.field.viewOffset, this.field.tilePosition);
		//	});

		this.scene.setTimeout(() => {
			this.onFinished();

			this._effectLayer.hide();
			this._effectLayer.destroy();
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
