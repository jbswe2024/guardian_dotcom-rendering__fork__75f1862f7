import type { FEFrontCard } from '../types/front';

/**
 * An 'arbitrary list of slow tags' once defined in Frontend.
 * If you have enough of one of these tags on a Tag front then your tag front is considered 'slow'
 *
 * The reasoning behind why it's these tags remains unclear, so I've written a small song
 * to help you come to terms this
 *
 * 🎶🎵🎶🎵🎶
 * And you may find yourself working on DCR
 * And you may find yourself looking at the tag front code
 * And you may ask yourself "What is the reason these tags are slow?"
 * And you may tell yourself "The reasoning must be documented somewhere"
 * And you may say to yourself "My god, why are there so many arbitrary rules?"
 *
 * Letting the trails go by, let the front speed hold me down...
 * 🎶🎵🎶🎵🎶
 */
const slowTags = [
	'type/cartoon',
	'type/gallery',
	'type/picture',
	'lifeandstyle/series/last-bites',
	'artanddesign/photography',
];

const frequencyThreshold = 0.8;

export const getSpeedFromTrails = (trails: FEFrontCard[]): 'slow' | 'fast' => {
	// <tag id, number of occurrences>
	const tagMap: Record<string, number> = {};

	trails.forEach((trail) => {
		const tags = trail.properties.maybeContent?.tags.tags;
		if (tags) {
			tags.forEach((tag) => {
				const existingItem = tagMap[tag.properties.id];
				if (existingItem !== undefined) {
					tagMap[tag.properties.id] = existingItem + 1;
				} else {
					tagMap[tag.properties.id] = 1;
				}
			});
		}
	});

	const matchingSlowTag = slowTags.find(
		(tag) => (tagMap[tag] ?? 0) / trails.length > frequencyThreshold,
	);

	return matchingSlowTag !== undefined ? 'slow' : 'fast';
};
