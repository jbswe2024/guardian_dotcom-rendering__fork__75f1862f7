import { css } from '@emotion/react';

import { brand } from '@guardian/source-foundations';
import { Hide } from './Hide';
import { Logo } from './Logo';
import { Links } from './Links.importable';
import { Island } from './Island';
import { EditionDropdown } from './EditionDropdown.importable';
import { ReaderRevenueLinks } from './ReaderRevenueLinks.importable';

const headerStyles = css`
	/* Ensure header height contains it's children */
	overflow: auto;
	/* Prevent a scrollbar appearing here on IE/Edge */
	-ms-overflow-style: none;
	background-color: ${brand[400]};
`;

type Props = {
	edition: Edition;
	idUrl?: string;
	mmaUrl?: string;
	discussionApiUrl: string;
	urls: ReaderRevenueCategories;
	remoteHeader: boolean;
	contributionsServiceUrl: string;
};

export const Header = ({
	edition,
	idUrl,
	mmaUrl,
	discussionApiUrl,
	urls,
	remoteHeader,
	contributionsServiceUrl,
}: Props) => (
	<div css={headerStyles}>
		<Hide when="below" breakpoint="desktop">
			<Island deferUntil="idle">
				<EditionDropdown
					edition={edition}
					dataLinkName="nav2 : topbar : edition-picker: toggle"
				/>
			</Island>
		</Hide>
		<Logo />
		<Island deferUntil="idle" clientOnly={true}>
			<ReaderRevenueLinks
				urls={urls}
				edition={edition}
				dataLinkNamePrefix="nav2 : "
				inHeader={true}
				remoteHeader={remoteHeader}
				contributionsServiceUrl={contributionsServiceUrl}
			/>
		</Island>
		<div id="links-root">
			<Island>
				<Links
					idUrl={idUrl}
					mmaUrl={mmaUrl}
					discussionApiUrl={discussionApiUrl}
				/>
			</Island>
		</div>
	</div>
);
