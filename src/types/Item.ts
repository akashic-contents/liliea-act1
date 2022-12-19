// アイテムの種類を表す型
import { WeaponType } from "../global/weapon";
export type ItemType = "recovery" | "powerup" | "exp" | "score" | "weapon" | "follower";
export type SpriteType = "sprite" | "frameSprite";

// アイテムの基本的な情報。どの種類のアイテムも共通して持つ情報。
export interface Item {
	type: ItemType; // アイテムの種類。
	assetId: string; // アイテムの画像アセットID。32*32の1枚絵を前提としている。
	spriteType?: SpriteType; // デフォルト: sprite
	name: string; // アイテム名。ただし現状のロジックではどこにも表示されていない。
	describe: string; // アイテムについての説明文。ただし現状のロジックではどこにも表示されていない。
}

// 回復アイテム
export interface RecoveryItem extends Item {
	type: "recovery";
	recoveryType: "ratio" | "fixed"; // 回復の種類。"ratio"ならキャラクターの最大HP量に応じた割合で、"fixed"なら固定値で回復。
	recoveryValue: number; // 回復量。"ratio"なら最大HP量に応じた割合(値域は0.0~1.0)、"fixed"なら固定値(値域は0以上)を表す。
}

// キャラクターを強化するアイテム
export interface PowerUpItem extends Item {
	type: "powerup";
	expType: WeaponType;
	expValue: number;

	attack: number; // 攻撃力の増加量。
	defence: number; // 防御力の増加量。
	speed: number; // フィールド移動速度の増加量。
	critical: number; // クリティカル率の増加量。
}

// 経験値が増えるアイテム。ただし現状LVの概念が無いためあまり意味の無いアイテムになっている。
export interface ExpItem extends Item {
	type: "exp";
	value: number; // 経験値の増加量。
}

// スコアが増えるアイテム
export interface ScoreItem extends Item {
	type: "score";
	score: number; // スコアの増加量。
}

// 武器アイテム。既に持っている場合は武器LVが上がる
export interface WeaponItem extends Item {
	type: "weapon";
	weaponId: string;
}

// フォロワー追加
export interface FollowerItem extends Item {
	type: "follower";
	characterId: string;
}
