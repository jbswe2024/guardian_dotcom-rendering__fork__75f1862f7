import { css, jsx as h } from '@emotion/react';
import { body } from '@guardian/source-foundations';
import { JSDOM } from 'jsdom';
import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { logger } from '../../server/lib/logging';
import type { Palette } from '../../types/palette';
import { QuoteIcon } from './QuoteIcon';

type Props = {
	html: string;
	palette: Palette;
	quoted?: boolean;
};

const baseBlockquoteStyles = css`
	margin-bottom: 16px;
	${body.medium()};
	font-style: italic;
	p {
		margin-bottom: 8px;
	}
`;

const simpleBlockquoteStyles = css`
	${baseBlockquoteStyles}
	margin-top: 16px;
	margin-right: 0;
	margin-bottom: 16px;
	margin-left: 33px;
`;

const quotedBlockquoteStyles = (palette: Palette) => css`
	${baseBlockquoteStyles}
	color: ${palette.text.blockquote};
`;

const parseHtml = (html: string): DocumentFragment => JSDOM.fragment(html);

// The nodeType for ELEMENT_NODE has the value 1.
function isElement(node: Node): node is Element {
	return node.nodeType === 1;
}

const getAttrs = (node: Node): NamedNodeMap | undefined =>
	isElement(node) ? node.attributes : undefined;

const textElement =
	(isQuoted: boolean, palette: Palette) =>
	(node: Node, key: number): ReactNode => {
		const text = node.textContent ?? '';
		const children = Array.from(node.childNodes).map(
			textElement(isQuoted, palette),
		);
		switch (node.nodeName) {
			case 'P': {
				// We want to add the quote icon to the first child (p) of the blockquote element
				if (isQuoted && node.parentElement?.nodeName === 'BLOCKQUOTE') {
					return (
						<p>
							<QuoteIcon colour={palette.fill.blockquoteIcon} />
							{children}
						</p>
					);
				}
				return h('p', { children });
			}
			case 'BLOCKQUOTE':
				return h('blockquote', {
					key,
					children,
					css: isQuoted
						? quotedBlockquoteStyles(palette)
						: simpleBlockquoteStyles,
				});
			case 'A':
				return h('A', {
					href: getAttrs(node)?.getNamedItem('href'),
					key,
					children,
				});
			case 'STRONG':
				return h('strong', {
					css: { fontWeight: 'bold' },
					key,
					children,
				});
			case '#text':
			case 'SPAN':
				return text;
			case 'B':
			case 'EM':
			case 'BR':
			case 'UL':
			case 'OL':
			case 'LI':
			case 'MARK':
			case 'SUB':
			case 'SUP':
				return h(node.nodeName, {
					key,
					children,
				});
			default:
				logger.warn(
					'BlockquoteBlockComponent: Unknown element received',
					{
						isDev: process.env.NODE_ENV !== 'production',
						element: {
							name: node.nodeName,
							html: isElement(node) ? node.outerHTML : undefined,
						},
					},
				);
				return null;
		}
	};

export const BlockquoteBlockComponent = ({ html, palette, quoted }: Props) => {
	const fragment = parseHtml(html);

	return h(Fragment, {
		children: Array.from(fragment.childNodes).map(
			textElement(!!quoted, palette),
		),
	});
};
