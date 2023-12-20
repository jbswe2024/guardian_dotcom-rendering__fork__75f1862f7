// @ts-check

/** @fileoverview
 *
 * Run: `make gen-stories` in the dotcom-rendering sub-directory
 *
 * This script was created as a replacement for storiesOf to generate all of the possible variants
 * of our Card and Layout components.
 *
 * It should be run whenever any of the Display, Design, or Theme `format` properties change
 *
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log, success, warn } from '../../../scripts/log.js';

const STORIES_PATH = resolve(
	dirname(fileURLToPath(new URL(import.meta.url))),
	'..',
	'..',
	'stories',
	'generated',
);
const LAYOUT_STORIES_FILE = resolve(STORIES_PATH, 'Layout.stories.tsx');
const LAYOUT_APPS_STORIES_FILE = resolve(
	STORIES_PATH,
	'Layout.apps.stories.tsx',
);
const CARD_STORIES_FILE = resolve(STORIES_PATH, 'Card.stories.tsx');
/** @param {string} componentName */
const README_FILE = (componentName) =>
	resolve(STORIES_PATH, `${componentName}Readme.stories.jsx`);

const CARD_TEMPLATE_HEADER = `
/*
 * DO NOT EDIT THIS FILE DIRECTLY
 * These stories were auto-generated by \`dotcom-rendering/scripts/gen-stories/gen-stories.js\`
 */

import { ArticleDesign, ArticleDisplay, ArticleSpecial, Pillar } from '@guardian/libs';
import { splitTheme } from '../../.storybook/decorators/splitThemeDecorator';
import { CardsWithDifferentThemes } from '../../src/components/Card/Card.stories';

// eslint-disable-next-line import/no-default-export -- we need a default here
export default {
	title: 'Components/Card/Format Variations',
	component: CardsWithDifferentThemes,
	chromatic: {
		diffThreshold: 0.2,
		pauseAnimationAtEnd: true,
	},
};
`;

const LAYOUT_TEMPLATE_HEADER = `
/*
 * DO NOT EDIT THIS FILE DIRECTLY
 * These stories were auto-generated by \`dotcom-rendering/scripts/gen-stories/gen-stories.js\`
 */
import { ArticleDesign, ArticleDisplay, ArticleSpecial, Pillar } from '@guardian/libs';
import { lightDecorator } from '../../.storybook/decorators/themeDecorator';
import { HydratedLayoutWrapper } from '../../src/layouts/Layout.stories';

// eslint-disable-next-line import/no-default-export -- we need a default here
export default {
	title: 'Components/Layout/Format Variations',
	component: HydratedLayoutWrapper,
	parameters: {
		chromatic: {
			diffThreshold: 0.2,
			pauseAnimationAtEnd: true,
			delay: 1200, // ensure that OnwardsUpper shows relevant data
		},
	},
};
`;

const LAYOUT_APPS_TEMPLATE_HEADER = `
/*
 * DO NOT EDIT THIS FILE DIRECTLY
 * These stories were auto-generated by \`dotcom-rendering/scripts/gen-stories/gen-stories.js\`
 */
import { ArticleDesign, ArticleDisplay, ArticleSpecial, Pillar } from '@guardian/libs';
import { breakpoints } from '@guardian/source-foundations';
import { darkDecorator, lightDecorator } from '../../.storybook/decorators/themeDecorator';
import { HydratedLayoutWrapper } from '../../src/layouts/Layout.stories';
// eslint-disable-next-line import/no-default-export -- we need a default here
export default {
	title: 'Components/Layout/Format Variations Apps',
	component: HydratedLayoutWrapper,
	parameters: {
		viewport: {
			defaultViewport: 'mobileMedium',
		},
		chromatic: {
			viewports: [
				breakpoints.mobile,
				breakpoints.tablet,
			],
			diffThreshold: 0.2,
			pauseAnimationAtEnd: true,
			delay: 1200, // ensure that OnwardsUpper shows relevant data
		},
	},
};
`;

const EXTRA_APPS_LAYOUT_STORIES = `
export const LiveblogAppsSingleContributorLight = () => {
	return (
			<HydratedLayoutWrapper
				displayName="Standard"
				designName="LiveBlog"
				theme="NewsPillar"
				renderingTarget="Apps"
				fixtureName='LiveBlogSingleContributor'
			/>
		);
	};
	LiveblogAppsSingleContributorLight.storyName = 'Apps: Display: Standard, Design: LiveBlog, Theme: NewsPillar, Mode: Light';
	LiveblogAppsSingleContributorLight.parameters = { config: {"renderingTarget":"Apps","darkModeAvailable":true} };
	LiveblogAppsSingleContributorLight.decorators = [lightDecorator(
			[{
				display:  ArticleDisplay.Standard,
				design: ArticleDesign.LiveBlog,
				theme: {...Pillar}.News,
			}]
		),
	];
	export const LiveblogAppsSingleContributorDark = () => {
	return (
			<HydratedLayoutWrapper
				displayName="Standard"
				designName="LiveBlog"
				theme="NewsPillar"
				renderingTarget="Apps"
				fixtureName='LiveBlogSingleContributor'
			/>
		);
	};
	LiveblogAppsSingleContributorDark.storyName = 'Apps: Display: Standard, Design: LiveBlog, Theme: NewsPillar, Mode: Dark';
	LiveblogAppsSingleContributorDark.parameters = { config: {"renderingTarget":"Apps","darkModeAvailable":true} };
	LiveblogAppsSingleContributorDark.decorators = [darkDecorator(
			[{
				display:  ArticleDisplay.Standard,
				design: ArticleDesign.LiveBlog,
				theme: {...Pillar}.News,
			}]
		),
	];
`;

/** @param {string} componentName */
const README_TEMPLATE = (componentName) => `
import { css } from '@emotion/react';

const ReadMe = () => (
	<section css={css\`
		padding: 1rem;
		& h1, p{
			margin-bottom: 0.5rem;
		}
		\`}>
		<h1 css={css\`font-size: 1.5em; font-weight: 400;\`}>Readme</h1>
		<p>
			The stories in this directory are automatically generated.
		</p>
		<p>
			To add new format variations to test, please edit the list in \`get-stories.mjs\`.
		</p>
	</section>
);

// eslint-disable-next-line import/no-default-export
export default {
	title: 'Components/${componentName}/Format Variations',
	component: ReadMe,
	chromatic: { disableSnapshot: true },
};

export const Readme = () => <ReadMe />;
`;

/**
 * @param {string} displayName
 * @param {string} designName
 * @param {string} theme
 * @param {import('../../src/types/configContext.js').Config} config
 *
 */
const generateLayoutStory = (displayName, designName, theme, config) => {
	const { darkModeAvailable, renderingTarget } = config;
	const storyVariableName =
		renderingTarget + displayName + designName + theme;

	return `
		export const ${storyVariableName + 'Light'} = () => {
			return (
				<HydratedLayoutWrapper
					displayName="${displayName}"
					designName="${designName}"
					theme="${theme}"
					renderingTarget="${renderingTarget}"
				/>
			);
		};
		${
			storyVariableName + 'Light'
		}.storyName = '${renderingTarget}: Display: ${displayName}, Design: ${designName}, Theme: ${theme}, Mode: Light';
		${storyVariableName + 'Light'}.parameters = { config: ${JSON.stringify(
			config,
		)} };
		${storyVariableName + 'Light'}.decorators = [lightDecorator(
				[{
					display:  ArticleDisplay.${displayName},
					design: ArticleDesign.${designName},
					theme: {...ArticleSpecial, ...Pillar}.${theme.replace('Pillar', '')},
				}]
			),
		];

		${
			darkModeAvailable
				? `export const ${storyVariableName + 'Dark'} = () => {
			return (
				<HydratedLayoutWrapper
					displayName="${displayName}"
					designName="${designName}"
					theme="${theme}"
					renderingTarget="${renderingTarget}"
				/>
			);
		};
		${
			storyVariableName + `Dark`
		}.storyName = '${renderingTarget}: Display: ${displayName}, Design: ${designName}, Theme: ${theme}, Mode: Dark';
		${storyVariableName + `Dark`}.parameters = { config: ${JSON.stringify(
			config,
		)} };
		${storyVariableName + `Dark`}.decorators = [darkDecorator(
				[{
					display:  ArticleDisplay.${displayName},
					design: ArticleDesign.${designName},
					theme: {...ArticleSpecial, ...Pillar}.${theme.replace('Pillar', '')},
				}]
			),
		];`
				: ''
		}
`;
};

/**
 * @param {string} displayName
 * @param {string} designName
 * @param {string} theme
 */
const generateCardStory = (displayName, designName, theme) => {
	const storyName = displayName + designName;

	return `
export const ${storyName} = () => {
	return (
		<CardsWithDifferentThemes
			display={ArticleDisplay.${displayName}}
			design={ArticleDesign.${designName}}
			title="${storyName}"
		/>
	);
};
${storyName}.storyName = '${displayName}Display ${designName}Design';
${storyName}.decorators = [splitTheme([{
	display: ArticleDisplay.${displayName},
	design: ArticleDesign.${designName},
	theme: {...ArticleSpecial, ...Pillar}.${theme.replace('Pillar', '')},
},])]
`;
};

/** @typedef {{display: string, design: string, theme: string, config: import('../../src/types/configContext.js').Config}} TestFormat */

const testLayoutWebFormats =
	/** @type {const} @satisfies {ReadonlyArray<TestFormat>} */ ([
		{
			display: 'Standard',
			design: 'Standard',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Standard',
			design: 'NewsletterSignup',
			theme: 'SportPillar',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Showcase',
			design: 'Picture',
			theme: 'OpinionPillar',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Immersive',
			design: 'PhotoEssay',
			theme: 'Labs',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Standard',
			design: 'Standard',
			theme: 'Labs',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Standard',
			design: 'Feature',
			theme: 'Labs',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Standard',
			design: 'Recipe',
			theme: 'Labs',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
		{
			display: 'Standard',
			design: 'LiveBlog',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Web', darkModeAvailable: false },
		},
	]);

const testLayoutAppsFormats =
	/** @type {const} @satisfies {ReadonlyArray<TestFormat>} */ ([
		{
			display: 'Standard',
			design: 'Standard',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'Recipe',
			theme: 'LifestylePillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'Standard',
			theme: 'Labs',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Showcase',
			design: 'Picture',
			theme: 'OpinionPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'Comment',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'Interactive',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Immersive',
			design: 'Standard',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'Analysis',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'LiveBlog',
			theme: 'NewsPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'LiveBlog',
			theme: 'SportPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'LiveBlog',
			theme: 'SpecialReportPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: true },
		},
		{
			display: 'Standard',
			design: 'LiveBlog',
			theme: 'SpecialReportAltPillar',
			config: { renderingTarget: 'Apps', darkModeAvailable: false },
		},
	]);

const generateLayoutStories = () => {
	log('[scripts/gen-stories] Generating layout stories.');
	let stories = 0;
	let template = LAYOUT_TEMPLATE_HEADER;

	for (const { display, design, theme, config } of testLayoutWebFormats) {
		template += generateLayoutStory(display, design, theme, config);
		stories++;
	}

	success(`[scripts/gen-stories] Generated ${stories} layout stories!`);
	return template;
};

const generateLayoutAppsStories = () => {
	log('[scripts/gen-stories] Generating layout stories.');
	let stories = 0;
	let template = LAYOUT_APPS_TEMPLATE_HEADER;

	for (const { display, design, theme, config } of testLayoutAppsFormats) {
		template += generateLayoutStory(display, design, theme, config);
		stories++;
	}

	success(`[scripts/gen-stories] Generated ${stories} layout stories!`);
	return (template += EXTRA_APPS_LAYOUT_STORIES);
};

const testCardFormats = [
	{
		display: 'Standard',
		design: 'Standard',
		theme: 'NewsPillar',
	},
];

const generateCardStories = () => {
	log('[scripts/gen-stories] Generating card stories.');
	let stories = 0;
	let template = CARD_TEMPLATE_HEADER;

	for (const { display, design, theme } of testCardFormats) {
		template += generateCardStory(display, design, theme);
		stories++;
	}

	success(`[scripts/gen-stories] Generated ${stories} card stories!`);
	return template;
};

const saveStories = () => {
	mkdirSync(STORIES_PATH, { recursive: true });

	const layoutContents = generateLayoutStories();
	writeFileSync(LAYOUT_STORIES_FILE, layoutContents);
	success(
		`[scripts/gen-stories] Saved layout stories to ${LAYOUT_STORIES_FILE}!`,
	);

	const layoutAppsContents = generateLayoutAppsStories();
	writeFileSync(LAYOUT_APPS_STORIES_FILE, layoutAppsContents);
	success(
		`[scripts/gen-stories] Saved layout stories to ${LAYOUT_APPS_STORIES_FILE}!`,
	);

	writeFileSync(README_FILE('Layout'), README_TEMPLATE('Layout'));
	success(`[scripts/gen-stories] Saved Readme ${README_FILE('Layout')}!`);

	const cardContents = generateCardStories();
	writeFileSync(CARD_STORIES_FILE, cardContents);
	success(
		`[scripts/gen-stories] Saved layout stories to ${CARD_STORIES_FILE}!`,
	);

	writeFileSync(README_FILE('Card'), README_TEMPLATE('Card'));
	success(`[scripts/gen-stories] Saved Readme ${README_FILE('Card')}!`);
};

const checkStories = () => {
	const cardContents = generateCardStories();
	const cardFileContents = readFileSync(CARD_STORIES_FILE);
	const layoutContents = generateLayoutStories();
	const layoutFileContents = readFileSync(LAYOUT_STORIES_FILE);
	const layoutAppsContents = generateLayoutAppsStories();
	const layoutAppsFileContents = readFileSync(LAYOUT_APPS_STORIES_FILE);

	log(
		'[scripts/check-stories] Checking if generated stories and checked in stories match.',
	);

	if (
		cardContents !== cardFileContents.toString() ||
		layoutContents !== layoutFileContents.toString() ||
		layoutAppsContents !== layoutAppsFileContents.toString()
	) {
		warn(
			'[scripts/check-stories] Generated stories and checked in stories do not match! A new format might have been added, please run `make gen-stories`',
		);

		process.exit(1);
	}

	success(
		'[scripts/check-stories] Generated stories and checked in stories match! No further action required!',
	);
};

export { checkStories, saveStories };
