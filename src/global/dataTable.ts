import type { Character } from "../types/Character";
import type { Item } from "../types/Item";
import { Stage } from "../types/Stage";
import type { Weapon } from "../types/Weapon";

class DataTable<T> {
	readonly _assetId: string;
	private _dataMap: { [id: string]: T };
	constructor(assetId: string) {
		this._assetId = assetId;
		// このクラスはSceneに依存せずアセットIDのみでどこからでも呼べるようにしたいので、ここで参照するアセットはグローバルにする必要がある
		this._dataMap = JSON.parse((g.game.assets[this._assetId] as g.TextAsset).data);
	}

	get(id: string): T {
		const character = this._dataMap[id];
		if (!character) {
			throw new Error(`${id} is not found. (assetId: ${this._assetId})`);
		}
		return character;
	}
}

export const characterDataTable = new DataTable<Character>("characters");
export const itemDataTable = new DataTable<Item>("items");
export const weaponDataTable = new DataTable<Weapon>("weapons");
export const stageDataTable = new DataTable<Stage>("stages");
export const dropItemDataTable = new DataTable<string[]>("dropItems");
