import { DEFAULT_TIME_LIMIT, TILE_HEIGHT, TILE_WIDTH } from "../config";
import { BossEntity } from "../entities/BossEntity";
import { CharacterEntity } from "../entities/CharacterEntity";
import { EventEntity } from "../entities/events/EventEntity";
import { FieldEntity } from "../entities/FieldEntity";
import { FollowerEntity } from "../entities/FollowerEntity";
import { createItemEntity, PowerUpItemEntity, RecoveryItemEntity, WeaponItemEntity, FollowerItemEntity } from "../entities/ItemEntity";
import { PlayableCharacterEntity } from "../entities/PlayableCharacterEntity";
import { StatusWindowEntity } from "../entities/StatusWindowEntity";
import { TimeEntity } from "../entities/TimeEntity";
import { characterDataTable, itemDataTable, stageDataTable } from "../global/dataTable";
import { createEventEntity } from "../global/event";
import { createUiSprite } from "../global/sprite";
import { Score } from "../types/Score";
import { MusicPlayer } from "../util/MusicPlayer";
import { SpawnTiming, Stage } from "../types/Stage";

// !! For Debug:
const useDebugFollower = false;

export interface GameFieldSceneParameterObject extends g.SceneParameterObject {
	stageId: string;
	playableCharacterId: string;
	timeLimit?: number;
	initialWeaponId?: string;
	onFinish?: (score: Score) => void;
}

type SceneStatus = "stopped" | "started";
type KeyToAudioPlayer = { [key: string]: g.AudioPlayer };

// ゲームシーン
export class GameFieldScene extends g.Scene {
	private _elapsedFrame: number = 0;
	private _numFollower: number = 0;
	private _status: SceneStatus = "started";
	private _stage: Stage;
	private _fieldEntity!: FieldEntity;
	private _eventEntities: EventEntity[] = [];
	private _enemySpawner!: Spawner<SpawnTiming>;
	private _itemSpawner!: Spawner<SpawnTiming>;
	private _eventsSpawner!: Spawner<SpawnTiming>;
	private _destinationOffset: g.CommonOffset | undefined;
	private _statusWindow: StatusWindowEntity;
	private _timeEntity: TimeEntity;
	private _musicPlayer: MusicPlayer;
	private _onFinish: ((score: Score) => void) | undefined;

	constructor(param: GameFieldSceneParameterObject) {
		super(param);
		this._stage = stageDataTable.get(param.stageId);
		this._onFinish = param.onFinish ?? undefined;
		this.onLoad.add(() => {
			this._initialize(param);
		});
	}

	createPlayerEntity(param: GameFieldSceneParameterObject): PlayableCharacterEntity {
		const character = characterDataTable.get(param.playableCharacterId);
		const playerEntity = new PlayableCharacterEntity({
			scene: this,
			src: this.asset.getImageById(character.assetId),
			width: 32,
			height: 32,
			data: character,
			playerId: g.game.selfId,
			weaponIds: param.initialWeaponId ? [param.initialWeaponId] : []
		});
		playerEntity.move(this._stage.startPosition.x - g.game.width / 2, this._stage.startPosition.y - g.game.height / 2);
		return playerEntity;
	}

	createFollower(characterId: string, playerEntity: PlayableCharacterEntity): FollowerEntity {
		const follower = characterDataTable.get(characterId);
		const entity = new FollowerEntity({
			scene: this,
			src: this.asset.getImageById(follower.assetId),
			width: 32,
			height: 32,
			data: follower,
			followee: playerEntity,
			numOrdinal: this._numFollower,
			weaponIds: follower.weaponIds ?? []
		});
		entity.move(playerEntity.offset.x - g.game.width / 2, playerEntity.offset.y - g.game.height / 2);
		this._numFollower++;
		return entity;
	}

	start(): void {
		this._fieldEntity.start();
		this._timeEntity.start();
		this._timeEntity.show();
		this._statusWindow.show();
		this._status = "started";
	}

	stop(): void {
		this._fieldEntity.stop();
		this._statusWindow.hide();
		this._timeEntity.stop();
		this._timeEntity.hide();
		this._status = "stopped";
	}

	setupAudio(): void {
		this._musicPlayer = new MusicPlayer(this);
		g.game.audio.sound.volume = 0.5;
		g.game.audio.music.volume = 0.5;
	}

	private _initialize(param: GameFieldSceneParameterObject): void {
		const playerEntity = this.createPlayerEntity(param);

		this._fieldEntity = new FieldEntity({
			scene: this,
			x: -this._stage.startPosition.x + g.game.width / 2,
			y: -this._stage.startPosition.y + g.game.height / 2,
			playerEntity,
			onFollowerAdded: follower => {
				if (this._statusWindow) this._statusWindow.updateFollowerIcon(follower, true);
			}
		});
		this.append(this._fieldEntity);

		if (useDebugFollower) {
			const followerIds = ["fireDog", "coldDog", "thunderDog", "spaceDog", "hime"];
			followerIds.forEach(id => {
				const entity = this.createFollower(id, playerEntity);
				this._fieldEntity.registerFollower(entity);
			});
		}

		this._statusWindow = new StatusWindowEntity({
			scene: this,
			character: playerEntity,
			x: 0,
			y: 0.05 * g.game.height,
			width: 0.15 * g.game.width
		});
		this._statusWindow.onUpdate.add(() => this._statusWindow.updateCharacter(this._fieldEntity.playerEntity));
		this.append(this._statusWindow);

		this._timeEntity = new TimeEntity({
			scene: this,
			timeLimit: param.timeLimit ?? this._stage.timeLimit ?? DEFAULT_TIME_LIMIT,
			x: 0.85 * g.game.width,
			width: 0.15 * g.game.width
		});
		this.append(this._timeEntity);

		this._enemySpawner = new Spawner({
			events: this._stage.emenies,
			spawnFunc: (id: string, offset: g.CommonOffset) => {
				const enemy = characterDataTable.get(id);
				const entity =
					enemy.type === "boss"
						? new BossEntity({
								scene: this,
								src: this.asset.getImageById(enemy.assetId),
								width: 128,
								height: 128,
								data: enemy
						  })
						: new CharacterEntity({
								scene: this,
								src: this.asset.getImageById(enemy.assetId),
								width: 32,
								height: 32,
								data: enemy
						  });
				this._fieldEntity.registerEnemy(entity, offset);
			}
		});

		this._eventsSpawner = new Spawner({
			events: this._stage.events,
			spawnFunc: (id: string, _: g.CommonOffset) => {
				const onFinished = (e: EventEntity): void => {
					e.destroy();
					this._eventEntities = this._eventEntities.filter(i => i !== e);
					if (e.shouldGameStopped()) {
						// ゲーム進行開始:
						this.start();
					}
				};
				const e = createEventEntity(this, id, this._fieldEntity, this._musicPlayer, onFinished);
				this._eventEntities.push(e);
				if (e.shouldGameStopped()) {
					// ゲーム進行停止:
					this.stop();
				}
			}
		});

		// アイテム湧きはない デバッグ時のみ使用する:
		this._itemSpawner = new Spawner({
			events: this._stage.items,
			spawnFunc: (id: string, offset: g.CommonOffset) => {
				const item = itemDataTable.get(id);
				const entity = createItemEntity({
					scene: this,
					src: this.asset.getImageById(item.assetId),
					width: TILE_WIDTH,
					height: TILE_HEIGHT,
					data: item
				});
				const func = (): void => {
					switch (entity.type) {
						case "powerup":
							this._fieldEntity.powerUpPlayerEntity(entity as PowerUpItemEntity);
							break;
						case "weapon":
							this._fieldEntity.addPlayerWeapon(entity as WeaponItemEntity);
							break;
						case "recovery":
							this._fieldEntity.addRecoveryItem(entity as RecoveryItemEntity);
							break;
						case "follower":
							const id = (entity as FollowerItemEntity).characterId;
							const follower = this.createFollower(id, this._fieldEntity.playerEntity);
							this._fieldEntity.registerFollower(follower);
							break;
					}
				};
				this._fieldEntity.registerItem(entity, offset, func);
			}
		});

		// ユーザ操作ハンドラ登録:
		this.onPointDownCapture.add(ev => {
			console.log(ev);
			if (this._status === "started") {
				this._destinationOffset = ev.point;
			}
		});
		this.onPointMoveCapture.add(ev => {
			if (this._status === "started" && this._destinationOffset) {
				this._destinationOffset.x += ev.prevDelta.x;
				this._destinationOffset.y += ev.prevDelta.y;
			}
		});
		this.onPointUpCapture.add(_ev => {
			this._destinationOffset = undefined;
		});
		this.onUpdate.add(this._updateHandler, this);

		// 音声初期化:
		this.setupAudio();
	}

	private _updateHandler(): void {
		if (this._status === "stopped") {
			return;
		}

		if (this._fieldEntity.isPlayerDied()) {
			const e = createEventEntity(this, "dead", this._fieldEntity, this._musicPlayer, () => this.start());
			this.stop();
			// ペナルティ: 戦闘不能演出中もタイマーは止めない
			this._timeEntity.start();
			this._timeEntity.show();
			this._eventEntities.push(e);
		}

		if (this._timeEntity.isTimeout()) {
			// 全ての音声再生を止めて次シーン遷移:
			this._musicPlayer.stopAll();
			this._showResult(createUiSprite(this, "timeUp"));
		}

		if (this._destinationOffset) {
			const diff = this._fieldEntity.movePlayerEntity(this._destinationOffset);
			this._destinationOffset.x += diff.x;
			this._destinationOffset.y += diff.y;
		}

		this._enemySpawner.handleUpdate(this._elapsedFrame);
		this._itemSpawner.handleUpdate(this._elapsedFrame);
		this._eventsSpawner.handleUpdate(this._elapsedFrame);
		this._elapsedFrame++;
	}

	private _showResult(entity: g.E): void {
		this.onUpdate.remove(this._updateHandler, this);
		this._announce(entity, 1500, () => {
			if (this._onFinish) {
				this._onFinish(this._fieldEntity.score);
			}
		});
	}

	private _announce(entity: g.E, time: number, func: () => void): void {
		const bgRect = new g.FilledRect({
			scene: this,
			cssColor: "black",
			width: g.game.width,
			height: g.game.height,
			opacity: 0.6
		});
		this.append(bgRect);
		entity.x = (g.game.width - entity.width) / 2;
		entity.y = (g.game.height - entity.height) / 2;
		this.append(entity);
		this.setTimeout(() => {
			bgRect.destroy();
			entity.destroy();
			func();
		}, time);
	}
}

interface SpawnerParameterObject<T extends SpawnTiming> {
	events: T[];
	spawnFunc: (id: string, offset: g.CommonOffset) => void;
}

// フィールド上での物体(敵やアイテムなど)の出現に関するクラス
class Spawner<T extends SpawnTiming> {
	readonly events: T[];
	readonly spawnFunc: (id: string, offset: g.CommonOffset) => void;
	protected currentIndex: number = 0;

	constructor(param: SpawnerParameterObject<T>) {
		this.events = param.events;
		this.spawnFunc = param.spawnFunc;
	}

	handleUpdate(elapsedFrame: number): void {
		if (this.currentIndex >= this.events.length) {
			return;
		}
		for (let i = this.currentIndex; i < this.events.length; i++) {
			const event = this.events[i];
			if (event.time !== elapsedFrame) {
				return;
			}
			const count = event.count ?? 1;
			const offset = event.relativeOffset ?? { x: 0, y: 0 };
			for (let _j = 0; _j < count; _j++) {
				this.spawnFunc(event.id, offset);
			}
			this.currentIndex = i + 1;
		}
	}
}
