export interface ButtonEntityParameterObject extends g.EParameterObject {
	assetId: string;
	pointUpEvent?: (ev: g.PointUpEvent) => void;
	pointDownEvent?: (ev: g.PointDownEvent) => void;
}

const OPACITY_WHEN_POINT_DOW = 0.6;

export class ButtonEntity extends g.E {
	private _sprite: g.Sprite;
	constructor(param: ButtonEntityParameterObject) {
		super(param);
		const asset = param.scene.asset.getImageById(param.assetId);
		this._sprite = new g.Sprite({
			scene: param.scene,
			src: asset,
			width: param.width ?? asset.width,
			height: param.height ?? asset.height,
			srcWidth: asset.width,
			srcHeight: asset.height,
			local: param.local ?? true,
			touchable: true
		});
		this._sprite.onPointDown.add(this.pointDownButtonEvent, this);
		this._sprite.onPointUp.add(this.pointUpButtonEvent, this);
		if (param.pointUpEvent) {
			this._sprite.onPointUp.add(param.pointUpEvent);
		}
		if (param.pointDownEvent) {
			this._sprite.onPointDown.add(param.pointDownEvent);
		}
		this.append(this._sprite);
	}

	private pointDownButtonEvent(): void {
		this._sprite.opacity = OPACITY_WHEN_POINT_DOW;
		this._sprite.modified();
	}

	private pointUpButtonEvent(): void {
		this._sprite.opacity = 1;
		this._sprite.modified();
	}
}
