// ----- Imports ----- //

import type { Campaign } from '@guardian/apps-rendering-api-models/campaign';
import type { Newsletter } from '@guardian/apps-rendering-api-models/newsletter';
import type { TimelineEvent } from '@guardian/atoms-rendering/dist/types/types';
import type { Atoms } from '@guardian/content-api-models/v1/atoms';
import type { BlockElement } from '@guardian/content-api-models/v1/blockElement';
import { ElementType } from '@guardian/content-api-models/v1/elementType';
import type { ArticleTheme } from '@guardian/libs';
import type { Option } from '@guardian/types';
import { fromNullable, map, withDefault } from '@guardian/types';
import { parseAtom } from 'atoms';
import { ElementKind } from 'bodyElementKind';
import { formatDate } from 'date';
import { parseAudio, parseGeneric, parseInstagram, parseVideo } from 'embed';
import type { Embed } from 'embed';
import type { Image as ImageData } from 'image';
import { parseImage } from 'image';
import { compose, pipe } from 'lib';
import { Optional } from 'optional';
import type { Context } from 'parserContext';
import type { KnowledgeQuizAtom, PersonalityQuizAtom } from 'quizAtom';
import { Result } from 'result';

// ----- Types ----- //

type Text = {
	kind: ElementKind.Text;
	doc: Node;
};

type HeadingTwo = {
	kind: ElementKind.HeadingTwo;
	doc: Node;
	id: Optional<string>;
};

type HeadingThree = {
	kind: ElementKind.HeadingThree;
	doc: Node;
	id: Optional<string>;
};

type Image = ImageData & {
	kind: ElementKind.Image;
};

type EmbedElement = {
	kind: ElementKind.Embed;
	embed: Embed;
};

interface InteractiveAtom {
	kind: ElementKind.InteractiveAtom;
	js: Option<string>;
	css: string;
	html: string;
}

interface ChartAtom {
	kind: ElementKind.ChartAtom;
	title: string;
	id: string;
	html: string;
	css: string[];
	js: string[];
}

interface ExplainerAtom {
	kind: ElementKind.ExplainerAtom;
	html: string;
	title: string;
	id: string;
}

interface MediaAtom {
	kind: ElementKind.MediaAtom;
	posterUrl: string;
	videoId: string;
	duration: Option<number>;
	caption: Option<DocumentFragment>;
	id: string;
	title: string;
}

interface ExpandableAtom {
	html: string;
	title: string;
	id: string;
	image?: string;
	credit?: string;
}

interface GuideAtom extends ExpandableAtom {
	kind: ElementKind.GuideAtom;
}

interface QandaAtom extends ExpandableAtom {
	kind: ElementKind.QandaAtom;
}

interface ProfileAtom extends ExpandableAtom {
	kind: ElementKind.ProfileAtom;
}

interface TimelineAtom {
	kind: ElementKind.TimelineAtom;
	title: string;
	id: string;
	description?: string;
	events: TimelineEvent[];
}

interface AudioAtom {
	kind: ElementKind.AudioAtom;
	id: string;
	trackUrl: string;
	kicker: string;
	title: string;
}

interface NewsletterSignUp extends Omit<Newsletter, 'theme'> {
	kind: ElementKind.NewsletterSignUp;
	theme: ArticleTheme;
}

type BodyElement =
	| Text
	| HeadingTwo
	| HeadingThree
	| Image
	| {
			kind: ElementKind.Pullquote;
			quote: string;
			attribution: Option<string>;
	  }
	| {
			kind: ElementKind.Interactive;
			url: string;
			alt: Option<string>;
	  }
	| {
			kind: ElementKind.RichLink;
			url: string;
			linkText: string;
	  }
	| {
			kind: ElementKind.Tweet;
			content: NodeList;
	  }
	| EmbedElement
	| {
			kind: ElementKind.Callout;
			id: string;
			campaign: Campaign;
			description: DocumentFragment;
	  }
	| {
			kind: ElementKind.LiveEvent;
			linkText: string;
			url: string;
			image?: string;
			price?: string;
			start?: string;
	  }
	| InteractiveAtom
	| ExplainerAtom
	| MediaAtom
	| GuideAtom
	| QandaAtom
	| ProfileAtom
	| TimelineAtom
	| ChartAtom
	| AudioAtom
	| KnowledgeQuizAtom
	| PersonalityQuizAtom
	| NewsletterSignUp;

type Elements = BlockElement[] | undefined;

type Body = Array<Result<string, BodyElement>>;

// ----- Functions ----- //

const tweetContent = (
	tweetId: string,
	doc: DocumentFragment,
): Result<string, NodeList> => {
	const blockquote = doc.querySelector('blockquote');

	if (blockquote !== null) {
		return Result.ok(blockquote.childNodes);
	}

	return Result.err(
		`There was no blockquote element in the tweet with id: ${tweetId}`,
	);
};

const toEmbedElement = (
	parsed: Result<string, Embed>,
): Result<string, BodyElement> =>
	parsed.map((embed) => ({
		kind: ElementKind.Embed,
		embed,
	}));

const slugify = (text: string): string => {
	return text
		.normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
		.toLowerCase() // Convert the string to lowercase letters
		.trim() // Remove whitespace from both sides of a string
		.replace(/\s+/g, '-') // Replace spaces with "-"
		.replace(/[^\w-]+/g, '') // Remove all non-word chars
		.replace(/--+/g, '-'); // Replace multiple "-" with single "-"
};

const flattenTextElement = (doc: Node): BodyElement[] => {
	const childNodes = Array.from(doc.childNodes);
	return childNodes.map((node) => {
		switch (node.nodeName) {
			case 'H2':
				return {
					kind: ElementKind.HeadingTwo,
					doc: node,
					id: Optional.fromNullable(node.textContent).flatMap(
						(text) => {
							const slug = slugify(text);
							return slug === ''
								? Optional.none()
								: Optional.some(slug);
						},
					),
				};
			default:
				return {
					kind: ElementKind.Text,
					doc: node,
				};
		}
	});
};

const parse =
	(context: Context, atoms?: Atoms, campaigns?: Campaign[]) =>
	(
		element: BlockElement,
	): Result<string, BodyElement> | Array<Result<string, BodyElement>> => {
		switch (element.type) {
			case ElementType.TEXT: {
				const html = element.textTypeData?.html;

				if (!html) {
					return Result.err('No html field on textTypeData');
				}

				const doc = context.docParser(html);

				return flattenTextElement(doc).map((elem) => Result.ok(elem));
			}

			case ElementType.IMAGE:
				return pipe(
					parseImage(context)(element),
					map<ImageData, Result<string, Image>>((image) =>
						Result.ok({
							kind: ElementKind.Image,
							...image,
						}),
					),
					withDefault<Result<string, Image>>(
						Result.err("I couldn't find a master asset"),
					),
				);

			case ElementType.PULLQUOTE: {
				const { html: quote, attribution } =
					element.pullquoteTypeData ?? {};

				if (!quote) {
					return Result.err('No quote field on pullquoteTypeData');
				}

				return Result.ok({
					kind: ElementKind.Pullquote,
					quote,
					attribution: fromNullable(attribution),
				});
			}

			case ElementType.INTERACTIVE: {
				const { iframeUrl, alt } = element.interactiveTypeData ?? {};

				if (!iframeUrl) {
					return Result.err(
						'No iframeUrl field on interactiveTypeData',
					);
				}

				return Result.ok({
					kind: ElementKind.Interactive,
					url: iframeUrl,
					alt: fromNullable(alt),
				});
			}

			case ElementType.RICH_LINK: {
				const { url, linkText } = element.richLinkTypeData ?? {};

				if (!url) {
					return Result.err('No "url" field on richLinkTypeData');
				} else if (!linkText) {
					return Result.err(
						'No "linkText" field on richLinkTypeData',
					);
				}

				return Result.ok({ kind: ElementKind.RichLink, url, linkText });
			}

			case ElementType.TWEET: {
				const { id, html: h } = element.tweetTypeData ?? {};

				if (!id) {
					return Result.err('No "id" field on tweetTypeData');
				} else if (!h) {
					return Result.err('No "html" field on tweetTypeData');
				}

				return tweetContent(id, context.docParser(h)).map(
					(content) => ({
						kind: ElementKind.Tweet,
						content,
					}),
				);
			}

			case ElementType.EMBED: {
				const { html: embedHtml } = element.embedTypeData ?? {};

				if (!embedHtml) {
					return Result.err('No html field on embedTypeData');
				}

				const id = context
					.docParser(embedHtml)
					.querySelector('[data-callout-tagname]')
					?.getAttribute('data-callout-tagname');

				if (id) {
					if (!campaigns) {
						return Result.err('No campaign data for this callout');
					}

					const campaign = campaigns.find(
						(campaign) => campaign.fields.tagName === id,
					);

					if (!campaign) {
						return Result.err('No matching campaign');
					}

					const description = context.docParser(
						campaign.fields.description ?? '',
					);
					return Result.ok({
						kind: ElementKind.Callout,
						id,
						campaign,
						description,
					});
				}

				return compose(
					toEmbedElement,
					parseGeneric(context.docParser),
				)(element);
			}

			case ElementType.MEMBERSHIP: {
				const {
					linkText,
					originalUrl: url,
					price,
					start,
					image,
				} = element.membershipTypeData ?? {};

				if (!linkText || !url) {
					return Result.err(
						'No linkText or originalUrl field on membershipTypeData',
					);
				}

				const formattedDate =
					start?.iso8601 && !isNaN(new Date(start.iso8601).valueOf())
						? formatDate(new Date(start.iso8601))
						: undefined;

				return Result.ok({
					kind: ElementKind.LiveEvent,
					linkText,
					url,
					price,
					start: formattedDate,
					image,
				});
			}

			case ElementType.INSTAGRAM:
				return compose(toEmbedElement, parseInstagram)(element);

			case ElementType.AUDIO:
				return compose(
					toEmbedElement,
					parseAudio(context.docParser),
				)(element);

			case ElementType.VIDEO:
				return compose(toEmbedElement, parseVideo)(element);

			case ElementType.CONTENTATOM: {
				if (!atoms) {
					return Result.err('No atom data returned by capi');
				}

				return parseAtom(element, atoms, context.docParser);
			}

			default:
				return Result.err(
					`I'm afraid I don't understand the element I was given: ${element.type}`,
				);
		}
	};

const parseElements =
	(context: Context, atoms?: Atoms, campaigns?: Campaign[]) =>
	(elements: Elements): Array<Result<string, BodyElement>> => {
		if (!elements) {
			return [Result.err('No body elements available')];
		}
		return elements.flatMap(parse(context, atoms, campaigns));
	};

// ----- Exports ----- //

export {
	ElementKind,
	BodyElement,
	HeadingTwo,
	HeadingThree,
	Body,
	Image,
	Text,
	Embed,
	GuideAtom,
	InteractiveAtom,
	MediaAtom,
	QandaAtom,
	ProfileAtom,
	TimelineAtom,
	AudioAtom,
	parseElements,
	NewsletterSignUp,
	flattenTextElement,
};
