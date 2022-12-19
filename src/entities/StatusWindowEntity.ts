import { Label } from "@akashic-extension/akashic-label";
import { font28 } from "../global/font";
import { CharacterEntity } from "./CharacterEntity";

interface StatusWindowEntityParameterObject extends g.EParameterObject {
	character: CharacterEntity;
}

// 現状は表示するフォロワー種別・武器種が固定
// global/dataTable と関係なくここで静的に定義しており、データと連動していないため注意:
export class StatusWindowEntity extends g.E {
	private _character: CharacterEntity;
	private _shotExpLabel: Label;
	private _shotExp: number;

	private _fireExpLabel: Label;
	private _fireExp: number;

	private _coldExpLabel: Label;
	private _coldExp: number;

	private _thunderExpLabel: Label;
	private _thunderExp: number;

	private _spaceExpLabel: Label;
	private _spaceExp: number;

	constructor(param: StatusWindowEntityParameterObject) {
		super(param);
		this._character = param.character;
		this.createLabels(param.character);
	}

	get characterStatus(): CharacterEntity {
		return this._character;
	}

	updateCharacter(character: CharacterEntity): void {
		const status = character.status;
		if (status.expWeaponTable.sword != null) {
			if (this._shotExp !== status.expWeaponTable.sword) {
				this._shotExpLabel.text = status.expWeaponTable.sword.toString();
				this._shotExpLabel.invalidate();
			}
		} else if (status.expWeaponTable.shot != null) {
			if (this._shotExp !== status.expWeaponTable.shot) {
				this._shotExpLabel.text = status.expWeaponTable.shot.toString();
				this._shotExpLabel.invalidate();
			}
		}
		if (status.expWeaponTable.fire != null && this._fireExp !== status.expWeaponTable.fire) {
			this._fireExpLabel.text = status.expWeaponTable.fire.toString();
			this._fireExpLabel.invalidate();
		}
		if (status.expWeaponTable.cold != null && this._coldExp !== status.expWeaponTable.cold) {
			this._coldExpLabel.text = status.expWeaponTable.cold.toString();
			this._coldExpLabel.invalidate();
		}
		if (status.expWeaponTable.thunder != null && this._thunderExp !== status.expWeaponTable.thunder) {
			this._thunderExpLabel.text = status.expWeaponTable.thunder.toString();
			this._thunderExpLabel.invalidate();
		}
		if (status.expWeaponTable.space != null && this._spaceExp !== status.expWeaponTable.space) {
			this._spaceExpLabel.text = status.expWeaponTable.space.toString();
			this._spaceExpLabel.invalidate();
		}
		this._character = character;
	}

	updateFollowerIcon(character: CharacterEntity, canIconDisplayed: boolean): void {
		const scene = this.scene;
		const iconWidth = 32;
		const iconHeight = 32;
		const iconX = 32;
		const iconY = -20;
		switch (character.name) {
			case "Moelu":
				this._fireExpLabel.append(
					new g.Sprite({
						scene,
						src: scene.asset.getImageById("item_follower_fire"),
						scaleX: 1.25,
						x: iconX,
						y: iconY,
						width: iconWidth,
						height: iconHeight,
						srcWidth: iconWidth,
						srcHeight: iconHeight
					})
				);
				break;
			case "SumSum":
				this._coldExpLabel.append(
					new g.Sprite({
						scene,
						src: scene.asset.getImageById("item_follower_cold"),
						scaleX: 1.25,
						x: iconX,
						y: iconY,
						width: iconWidth,
						height: iconHeight,
						srcWidth: iconWidth,
						srcHeight: iconHeight
					})
				);
				break;
			case "Billy":
				this._thunderExpLabel.append(
					new g.Sprite({
						scene,
						src: scene.asset.getImageById("item_follower_thunder"),
						scaleX: 1.25,
						x: iconX,
						y: iconY,
						width: iconWidth,
						height: iconHeight,
						srcWidth: iconWidth,
						srcHeight: iconHeight
					})
				);
				break;
			case "Spaciea":
				this._spaceExpLabel.append(
					new g.Sprite({
						scene,
						src: scene.asset.getImageById("item_follower_space"),
						scaleX: 1.25,
						x: iconX,
						y: iconY,
						width: iconWidth,
						height: iconHeight,
						srcWidth: iconWidth,
						srcHeight: iconHeight
					})
				);
				break;
				break;
		}
	}

	createLabels(character: CharacterEntity): void {
		const scene = this.scene;
		const font = font28;
		const status = character.status;
		const iconX = 32;
		const iconY = -12;
		let offsetX = -8;

		const shotExp = status.expWeaponTable.sword > 0 ? status.expWeaponTable.sword : status.expWeaponTable.shot;
		this._shotExpLabel = new Label({
			scene,
			font,
			text: shotExp ? `${shotExp}` : "0",
			x: offsetX,
			scaleX: 0.75,
			fontSize: 28,
			textAlign: "right",
			width: 0.9 * this.width
		});
		this._shotExp = shotExp;
		this._shotExpLabel.append(
			new g.Sprite({
				scene,
				src: scene.asset.getImageById("shot"),
				scaleX: 1.25,
				x: iconX,
				y: iconY,
				width: 16,
				height: 16,
				srcWidth: 16,
				srcHeight: 16
			})
		);
		this.append(this._shotExpLabel);
		offsetX += 64;

		const fireExp = status.expWeaponTable.fire;
		this._fireExpLabel = new Label({
			scene,
			font,
			text: fireExp ? `${fireExp}` : "0",
			x: offsetX,
			scaleX: 0.75,
			fontSize: 28,
			textAlign: "right",
			width: 0.9 * this.width
		});
		this._fireExp = fireExp;
		this._fireExpLabel.append(
			new g.Sprite({
				scene,
				src: scene.asset.getImageById("item_fire"),
				x: iconX,
				y: iconY,
				scaleX: 1.25,
				width: 16,
				height: 16
			})
		);
		this.append(this._fireExpLabel);
		offsetX += 64;

		const coldExp = status.expWeaponTable.cold;
		this._coldExpLabel = new Label({
			scene,
			font,
			text: coldExp ? `${coldExp}` : "0",
			x: offsetX,
			scaleX: 0.75,
			fontSize: 28,
			textAlign: "right",
			width: 0.9 * this.width
		});
		this._coldExp = coldExp;
		this._coldExpLabel.append(
			new g.Sprite({
				scene,
				src: scene.asset.getImageById("item_cold"),
				x: iconX,
				y: iconY,
				scaleX: 1.25,
				width: 16,
				height: 16
			})
		);
		this.append(this._coldExpLabel);
		offsetX += 64;

		const thunderExp = status.expWeaponTable.thunder;
		this._thunderExpLabel = new Label({
			scene,
			font,
			text: coldExp ? `${thunderExp}` : "0",
			x: offsetX,
			scaleX: 0.75,
			fontSize: 28,
			textAlign: "right",
			width: 0.9 * this.width
		});
		this._thunderExp = thunderExp;
		this._thunderExpLabel.append(
			new g.Sprite({
				scene,
				src: scene.asset.getImageById("item_thunder"),
				x: iconX,
				y: iconY,
				scaleX: 1.25,
				width: 16,
				height: 16
			})
		);
		this.append(this._thunderExpLabel);
		offsetX += 64;

		const spaceExp = status.expWeaponTable.space;
		this._spaceExpLabel = new Label({
			scene,
			font,
			text: spaceExp ? `${spaceExp}` : "0",
			x: offsetX,
			scaleX: 0.75,
			fontSize: 28,
			textAlign: "right",
			width: 0.9 * this.width
		});
		this._spaceExp = spaceExp;
		this._spaceExpLabel.append(
			new g.Sprite({
				scene,
				src: scene.asset.getImageById("item_space"),
				x: iconX,
				y: iconY,
				scaleX: 1.25,
				width: 16,
				height: 16
			})
		);
		this.append(this._spaceExpLabel);
		offsetX += 64;
	}
}
