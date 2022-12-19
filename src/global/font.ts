function createBitmapFont(imageAsset: g.ImageAsset, textAsset: g.TextAsset, width: number, height: number): g.BitmapFont {
	return new g.BitmapFont({
		src: imageAsset,
		map: JSON.parse(textAsset.data),
		defaultGlyphWidth: width,
		defaultGlyphHeight: height
	});
}

export const font28 = createBitmapFont(g.game.assets.ui_common as g.ImageAsset, g.game.assets.glyph28 as g.TextAsset, 28, 32);

export const font72 = createBitmapFont(g.game.assets.ui_common as g.ImageAsset, g.game.assets.glyph72 as g.TextAsset, 72, 82);
