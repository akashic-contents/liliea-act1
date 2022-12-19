const UI_DIMENSIONS = {
	// これらの数値は ui_common.png 上の座標で、配列の各要素はそれぞれ[始点x座標, 始点y座標, 終点x座標, 終点y座標]を表している
	scoreFrame: [1, 188, 446, 356],
	clockIcon: [1, 524, 37, 560],
	ready: [447, 188, 691, 284],
	start: [447, 285, 733, 364],
	timeUp: [478, 444, 826, 539],
	gameOver: [1, 444, 428, 525],
	ptImage: [38, 524, 66, 552]
} as const;

export type UiName = keyof typeof UI_DIMENSIONS;

export function createUiSprite(scene: g.Scene, uiName: UiName): g.Sprite {
	const uiKind = UI_DIMENSIONS[uiName];
	return createSprite(scene, "ui_common", uiKind[0], uiKind[1], uiKind[2], uiKind[3]);
}

export function createSprite(scene: g.Scene, id: string, sx: number, sy: number, ex: number, ey: number): g.Sprite {
	const sw = ex - sx;
	const sh = ey - sy;
	return new g.Sprite({
		scene,
		src: scene.asset.getImageById(id),
		srcX: sx,
		srcY: sy,
		srcWidth: sw,
		srcHeight: sh,
		width: sw,
		height: sh
	});
}
