
/*
 * DO NOT EDIT THIS FILE DIRECTLY
 * These stories were auto-generated by `dotcom-rendering/scripts/gen-stories/gen-stories.js`
 */

import { ArticleDisplay, ArticleDesign } from '@guardian/libs';
import { CardsWithDifferentThemes } from '../../src/web/components/Card/Card.stories';

// eslint-disable-next-line import/no-default-export
export default {
	title: 'Components/Card/Format Variations',
	component: CardsWithDifferentThemes,
	chromatic: {
		diffThreshold: 0.2,
		pauseAnimationAtEnd: true,
	},
};

export const StandardStandard = () => {
	return (
		<CardsWithDifferentThemes
			display={ArticleDisplay.Standard}
			design={ArticleDesign.Standard}
			title="StandardStandard"
		/>
	);
};
StandardStandard.story = {
	name: 'StandardDisplay StandardDesign'
};
