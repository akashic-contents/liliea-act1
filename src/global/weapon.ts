import { BeamWeaponEntity } from "../entities/weapons/BeamWeaponEntity";
import { ColdWeaponEntity } from "../entities/weapons/ColdWeaponEntity";
import { FireWeaponEntity } from "../entities/weapons/FireWeaponEntity";
import { InhaleWeaponEntity } from "../entities/weapons/InhaleWeaponEntity";
import { ShotWeaponEntity } from "../entities/weapons/ShotWeaponEntity";
import { SpaceWeaponEntity } from "../entities/weapons/SpaceWeaponEntity";
import { SwordWeaponEntity } from "../entities/weapons/SwordWeaponEntity";
import { ThunderWeaponEntity } from "../entities/weapons/ThunderWeaponEntity";
import { WeaponEntity } from "../entities/weapons/WeaponEntity";
import { weaponDataTable } from "./dataTable";

export type { WeaponType } from "../types/Weapon";

export function createWeaponEntity(scene: g.Scene, id: string): WeaponEntity {
	const data = weaponDataTable.get(id);
	switch (data.assetId) {
		case "ShotWeaponEntity":
			return new ShotWeaponEntity({ scene, data });
		case "FireWeaponEntity":
			return new FireWeaponEntity({ scene, data });
		case "ColdWeaponEntity":
			return new ColdWeaponEntity({ scene, data });
		case "ThunderWeaponEntity":
			return new ThunderWeaponEntity({ scene, data });
		case "BeamWeaponEntity":
			return new BeamWeaponEntity({ scene, data });
		case "SpaceWeaponEntity":
			return new SpaceWeaponEntity({ scene, data });
		case "InhaleWeaponEntity":
			return new InhaleWeaponEntity({ scene, data });
		case "SwordWeaponEntity":
			return new SwordWeaponEntity({ scene, data });
		default:
			throw new Error(`${data.assetId} is not found.`);
	}
}
