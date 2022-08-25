// ----- Imports ----- //

import { css, SerializedStyles } from '@emotion/react';
import type { ArticleFormat } from '@guardian/libs';
import { remSpace } from '@guardian/source-foundations';
import type { FC, ReactNode } from 'react';

// ----- Component ----- //

const baseStyles = css`
	padding-left: ${remSpace[6]};
	padding-bottom: 0.375rem;

	> p:first-of-type {
		display: inline;
		padding: 0;
	}
`;

interface Props {
	format: ArticleFormat;
	children: ReactNode;
	className?: SerializedStyles;
}

const ListItem: FC<Props> = ({ format, children, className }) => (
	<li css={[baseStyles, className]}>{children}</li>
);

// ----- Exports ----- //

export default ListItem;
