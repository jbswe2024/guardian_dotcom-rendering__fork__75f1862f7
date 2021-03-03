import { Atoms } from '@guardian/content-api-models/v1/atoms';
import { BlockElement } from '@guardian/content-api-models/v1/blockElement';
import { ElementType } from '@guardian/content-api-models/v1/elementType';
import { Atom } from '@guardian/content-atom-model/atom';
import { AtomData } from '@guardian/content-atom-model/atomData';
import { AtomType } from '@guardian/content-atom-model/atomType';
import { ContentChangeDetails } from '@guardian/content-atom-model/contentChangeDetails';
import { DisplayType } from '@guardian/content-atom-model/explainer/displayType';
import { AssetType } from '@guardian/content-atom-model/media/assetType';
import { Category } from '@guardian/content-atom-model/media/category';
import { MediaAtom } from '@guardian/content-atom-model/media/mediaAtom';
import { Platform } from '@guardian/content-atom-model/media/platform';
import { none, some } from '@guardian/types';
import { Int64 } from 'thrift';
import { parseVideo } from 'video';

describe('parseVideo', () => {
	let blockElement: BlockElement;
	let atoms: Atoms;
	let atom: Atom;
	let atomData: AtomData;
	let mediaAtom: MediaAtom;

	beforeEach(() => {
		blockElement = {
			type: ElementType.VIDEO,
			assets: [
				{
					type: AssetType.VIDEO,
				},
			],
			contentAtomTypeData: {
				atomId: 'atomId2',
				atomType: 'someAtomType',
			},
		};

		mediaAtom = {
			assets: [
				{
					assetType: AssetType.VIDEO,
					id: 'asset-id',
					version: new Int64(2),
					platform: Platform.YOUTUBE,
				},
			],
			activeVersion: new Int64(2),
			title: 'mediaTitle',
			category: Category.DOCUMENTARY,
			posterUrl: 'poster-url',
		};

		atomData = {
			kind: 'media',
			media: mediaAtom,
		};

		atom = {
			id: 'atomId2',
			atomType: AtomType.MEDIA,
			labels: ['someLabel'],
			defaultHtml: 'someHtml',
			data: atomData,
			contentChangeDetails: {} as ContentChangeDetails,
			commissioningDesks: ['someDesk'],
		};

		atoms = {
			media: [atom],
		};
	});

	test('returns video', () => {
		const expected = some({
			posterUrl: 'poster-url',
			videoId: 'asset-id',
			duration: undefined,
			atomId: 'atomId2',
			title: 'mediaTitle',
		});
		expect(parseVideo(blockElement, atoms)).toEqual(expected);
	});

	test('returns none given no atoms', () => {
		expect(parseVideo(blockElement)).toEqual(none);
	});

	test('returns none given no media in atoms', () => {
		atoms = {};
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});

	test('returns none given none of the media atoms matches the element atom type id', () => {
		blockElement.contentAtomTypeData = {
			atomId: 'atomId1',
			atomType: 'someAtomType',
		};
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});

	test("returns none given the atom data of the matched media atom does does not have 'media' kind", () => {
		const differentAtomData: AtomData = {
			kind: 'explainer',
			explainer: {
				title: 'explainerTitle',
				body: 'someBody',
				displayType: DisplayType.FLAT,
			},
		};
		atom.data = differentAtomData;
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});

	test('returns none given matched atom does not have posterUrl', () => {
		mediaAtom.posterUrl = undefined;
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});

	test('returns none given media atom does not have any assets', () => {
		mediaAtom.assets = [];
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});

	test('returns none given media atom asset version does not match media atom activeVersion', () => {
		mediaAtom.activeVersion = new Int64(3);
		expect(parseVideo(blockElement, atoms)).toEqual(none);
	});
});
