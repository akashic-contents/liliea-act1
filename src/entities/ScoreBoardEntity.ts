import { Label } from "@akashic-extension/akashic-label";
import { Timeline, Easing } from "@akashic-extension/akashic-timeline";
import { font28, font72 } from "../global/font";
import { createUiSprite } from "../global/sprite";
import { Score, getTotalScore } from "../types/Score";

interface ScoreBoardEntityParameterObject extends g.EParameterObject {
	score: Score;
	onFinish: () => void;
}

type ExpKey = "fireExp" | "coldExp" | "thunderExp" | "spaceExp";
type NumFollowerKey = "numMoelu" | "numSumSum" | "numBilly" | "numSpaciea";
type DamageKey = "damage" | "noDamageBonus";
type TotalScoreKey = "totalScore";
type ScoreLabelMapKey = Partial<ExpKey | NumFollowerKey | DamageKey | TotalScoreKey>;

export class ScoreBoardEntity extends g.E {
	private _timeline: Timeline;
	private _score: Score;
	private _totalScore: number;
	private _boardSprite: g.Sprite;
	private _hintSprite: g.Sprite;
	private _boardBg: g.FilledRect;
	private _onFinish: () => void;
	private _scoreLabelMap: { [K in ScoreLabelMapKey]?: Label } = {};

	constructor(param: ScoreBoardEntityParameterObject) {
		super(param);
		this._score = param.score;
		this._onFinish = param.onFinish;
		this._totalScore = getTotalScore(param.score);
		this._timeline = new Timeline(this.scene);
		this.createScoreBoard();
	}

	finish(): void {
		this._timeline.completeAll();
		if (this._hintSprite) {
			this._timeline.create(this._hintSprite).wait(2000).fadeIn(3000, Easing.easeOutCubic).fadeOut(3000, Easing.easeInCubic);
		}
		if (this._boardSprite) {
			this._timeline
				.create(this._boardSprite)
				.fadeOut(2000)
				.wait(6100)
				.call(() => {
					this._timeline.clear();
					if (this._boardBg) {
						this._boardBg.destroy();
					}
					if (this._boardSprite) {
						this._boardSprite.destroy();
					}
					if (this._hintSprite) {
						this._hintSprite.destroy();
					}
					this._onFinish();
				});
		}
	}

	createScoreBoard(): void {
		const scene = this.scene;
		this._boardSprite = new g.Sprite({
			scene,
			src: scene.asset.getImageById("bg_result"),
			x: g.game.width,
			opacity: 0,
			touchable: true
		});
		this.append(this._boardSprite);

		this._hintSprite = new g.Sprite({
			scene,
			src: scene.asset.getImageById("hint"),
			y: g.game.height / 2 - 24,
			opacity: 0
		});
		this.append(this._hintSprite);

		const boardBgEdge = 32;
		this._boardBg = new g.FilledRect({
			scene,
			x: this._boardSprite.width - boardBgEdge,
			y: boardBgEdge,
			width: this._boardSprite.width - boardBgEdge * 2,
			height: this._boardSprite.height - boardBgEdge * 2,
			cssColor: "black",
			scaleX: 0,
			anchorX: 1,
			opacity: 0
		});
		this._boardSprite.append(this._boardBg);

		this.displayIcons();
		this.displayLabels();
		this.displayNumFollowers(this._score);
		this.displayWeaponExp(this._score);
		this.displayDamage(this._score);

		this._timeline
			.create(this._boardSprite)
			.fadeIn(2000, Easing.easeOutCubic)
			.con()
			.moveTo(0, 0, 2000, Easing.easeOutCubic)
			.wait(2000)
			.call(() => {
				this.displayTotalScore(this._totalScore);
			})
			.wait(2000)
			.call(() => {
				// 以降スキップ受付:
				this._boardSprite.onPointDown.add(this.finish, this);
			});

		this._timeline
			.create(this._boardBg)
			.wait(2000)
			.to({ opacity: 0.5 }, 1000, Easing.easeOutCubic)
			.con()
			.scaleTo(1, 1, 1000, Easing.easeOutCubic);
	}

	displayLabels(): void {
		const scene = this.scene;
		const opacity = 2;
		const scaleX = 0.5;
		const scaleY = 0.5;
		let x = 96;
		let y = 64;
		{
			const sprite = new g.Sprite({
				scene,
				src: scene.asset.getImageById("result_label_followers"),
				x,
				y,
				scaleX,
				scaleY,
				opacity
			});
			this._boardBg.append(sprite);
		}
		x += 192;
		{
			const sprite = new g.Sprite({
				scene,
				src: scene.asset.getImageById("result_label_exp"),
				x,
				y,
				scaleX,
				scaleY,
				opacity
			});
			this._boardBg.append(sprite);
		}
		x = 96;
		y = 320;
		{
			const sprite = new g.Sprite({
				scene,
				src: scene.asset.getImageById("result_label_nodamage"),
				x,
				y,
				scaleX,
				scaleY,
				opacity
			});
			this._boardBg.append(sprite);
		}
	}

	displayIcons(): void {
		const scene = this.scene;
		const width = 32;
		const height = 32;
		const srcWidth = 32;
		const srcHeight = 32;
		const opacity = 2;
		const frames = [0, 1, 2];
		const interval = 1000;
		const loop = true;

		let x = 96;
		let y = 128;
		{
			const sprite = new g.FrameSprite({
				scene,
				src: scene.asset.getImageById("item_follower_fire"),
				x,
				y,
				width,
				height,
				srcWidth,
				srcHeight,
				opacity,
				frames,
				interval,
				loop
			});
			sprite.start();
			this._boardBg.append(sprite);
		}
		y += 48;
		{
			const sprite = new g.FrameSprite({
				scene,
				src: scene.asset.getImageById("item_follower_cold"),
				x,
				y,
				width,
				height,
				srcWidth,
				srcHeight,
				opacity,
				frames,
				interval,
				loop
			});
			sprite.start();
			this._boardBg.append(sprite);
		}
		y += 48;
		{
			const sprite = new g.FrameSprite({
				scene,
				src: scene.asset.getImageById("item_follower_thunder"),
				x,
				y,
				width,
				height,
				srcWidth,
				srcHeight,
				opacity,
				frames,
				interval,
				loop
			});
			sprite.start();
			this._boardBg.append(sprite);
		}
		y += 48;
		{
			const sprite = new g.FrameSprite({
				scene,
				src: scene.asset.getImageById("item_follower_space"),
				x,
				y,
				width,
				height,
				srcWidth,
				srcHeight,
				opacity,
				frames,
				interval,
				loop
			});
			sprite.start();
			this._boardBg.append(sprite);
		}
	}

	displayNumFollowers(score: Score): void {
		const scene = this.scene;
		const font = font28;
		const fontSize = 28;
		const opacity = 2;
		const scaleX = 1;
		const textAlign = "right";
		const width = 64;

		let x = 128;
		let y = 128;
		{
			const text = this._score.nameToNumFollowers.Moelu.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.numMoelu = label;
		}
		y += 48;
		{
			const text = this._score.nameToNumFollowers.SumSum.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.numSumSum = label;
		}
		y += 48;
		{
			const text = this._score.nameToNumFollowers.Billy.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.numBilly = label;
		}
		y += 48;
		{
			const text = this._score.nameToNumFollowers.Spaciea.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.numSpaciea = label;
		}
		console.log(this._scoreLabelMap);
	}

	displayWeaponExp(score: Score): void {
		const scene = this.scene;
		const font = font28;
		const fontSize = 28;
		const opacity = 2;
		const scaleX = 1;
		const textAlign = "right";
		const width = 128;

		let x = 256;
		let y = 128;
		{
			const text = this._score.typeToExp.fire.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.fireExp = label;
		}
		y += 48;
		{
			const text = this._score.typeToExp.cold.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.coldExp = label;
		}
		y += 48;
		{
			const text = this._score.typeToExp.thunder.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.thunderExp = label;
		}
		y += 48;
		{
			const text = this._score.typeToExp.space.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.spaceExp = label;
		}
		console.log(this._scoreLabelMap);
	}

	displayDamage(score: Score): void {
		const scene = this.scene;
		const font = font28;
		const fontSize = 28;
		const opacity = 2;
		const scaleX = 1;
		const textAlign = "right";

		const width = 128;
		let x = 64;
		let y = 384;
		{
			const text = this._score.damage.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.damage = label;
		}
		x = 256;
		{
			const damage = Math.floor(this._score.damage);
			const noDamageBonus = damage < 100 ? (100 - damage) * 10 : 0;
			const text = noDamageBonus.toString();
			const label = new Label({
				scene,
				x,
				y,
				font,
				text,
				scaleX,
				opacity,
				fontSize,
				textAlign,
				width
			});
			this._boardBg.append(label);
			this._scoreLabelMap.noDamageBonus = label;
		}
	}

	displayTotalScore(totalScore: number): void {
		const scene = this.scene;
		const font = font72;
		const fontSize = 72;
		const scaleX = 0.5;
		const scaleY = 0.5;
		const opacity = 2;
		const textAlign = "right";

		const sprite = createUiSprite(scene, "scoreFrame");
		const x = (g.game.width - sprite.width * scaleX) / 2 - 32;
		const y = -32;
		sprite.x = x + g.game.width;
		sprite.y = y;
		sprite.scaleX = scaleX;
		sprite.scaleY = scaleY;
		sprite.opacity = opacity;
		sprite.modified();

		const label = new Label({
			scene,
			font,
			text: `${totalScore}`,
			fontSize,
			textAlign,
			width: 0.7 * sprite.width,
			x: 0.1 * sprite.width,
			y: 0.5 * sprite.height
		});
		sprite.append(label);
		this._boardBg.append(sprite);
		this._scoreLabelMap.totalScore = label;

		this._timeline.create(sprite).moveTo(x, y, 500).moveBy(10, 0, 100).moveBy(-20, 0, 100).moveBy(15, 0, 100).moveBy(-5, 0, 100);
	}
}
