export type WeaponType = "shot" | "fire" | "cold" | "thunder" | "beam" | "space" | "sword";

// 武器に関する情報
export interface Weapon {
	type: WeaponType;
	assetId: string; // 武器のスクリプトアセットID。
	name: string; // 武器名。ただし現状のロジックではどこにも表示されていない。
	describe: string; // 武器についての説明。ただし現状のロジックではどこにも表示されていない。
	frameSpriteAssetId?: string;
	speed?: number;
	isRotate?: boolean;
}
