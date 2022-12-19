// import { GAME_HEIGHT, GAME_WIDTH } from "../../config";
// import { calculateDamageValue } from "../../util/calculate";
// import { CharacterEntity } from "../CharacterEntity";
// import { FollowerEntity } from "../FollowerEntity";
// import { ItemEntity, PowerUpItemEntity, RecoveryItemEntity, WeaponItemEntity } from "../ItemEntity";
// import { PlayableCharacterEntity } from "../PlayableCharacterEntity";
// import { FieldEntityParameterObject, FieldEntity} from "../FieldEntity";
//
// export class Stage1FieldEntity extends FieldEntity {
//	private _baseLayer: g.Sprite;
//
//	constructor(param: FieldEntityParameterObject) {
//		super(param);
//		const scene = param.scene;
//	}
//
//    createField(): void {
//		this._tile = new g.Sprite({
//			scene,
//			src: scene.asset.getImageById("field1a"),
//			touchable: true
//		});
//
//		// 仮想タイル 80x60 とする:
//		this._tileArea = {
//			x: 0,
//			y: 0,
//			width: param.tileWidth * 80,
//			height: param.tileHeight * 60
//		};
//		this._viewOffset = { x: -param.x, y: -param.y };
//
//		this._playerEntity = param.playerEntity;
//		this._followerLayer = new g.E({ scene });
//		this._enemyLayer = new g.E({ scene });
//		this._itemLayer = new g.E({ scene });
//
//		// 描画順設定:
//		this.append(this._tile);
//
//		this._tile.append(new g.Sprite({ scene, src: scene.asset.getImageById("field1b") }));
//
//		this._tile.append(this._itemLayer);
//		this._tile.append(this._enemyLayer);
//		this._tile.append(this._followerLayer);
//		this._tile.append(this._playerEntity);
//
//		this._tile.append(new g.Sprite({ scene, src: scene.asset.getImageById("field1c") }));
//	}
// }
