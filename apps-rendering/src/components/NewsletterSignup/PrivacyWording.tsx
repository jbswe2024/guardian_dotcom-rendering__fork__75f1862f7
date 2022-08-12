// ----- Imports ----- //

import { css } from '@emotion/react';
import { neutral, textSans } from '@guardian/source-foundations';
import { Link } from '@guardian/source-react-components';
import type { FC } from 'react';

// ----- Component ----- //

interface Props {
	useCaptcha: boolean;
}

const termsStyle = css`
	${textSans.xxsmall({ lineHeight: 'tight' })}
	color: ${neutral[46]};
	a {
		${textSans.xxsmall({ fontWeight: 'bold' })};
		color: ${neutral[0]};
		text-decoration: underline;
		:hover {
			color: ${neutral[0]};
			text-decoration: underline;
		}
	}
	strong {
		color: ${neutral[0]};
		font-weight: bold;
	}
`;

const PrivacyWording: FC<Props> = ({ useCaptcha }) => {
	return (
		<p css={termsStyle}>
			<strong>Privacy Notice: </strong>
			<span>
				Newsletters may contain info about charities, online ads, and
				content funded by outside parties. For more information see our{' '}
				<Link
					data-ignore="global-link-styling"
					href="https://www.theguardian.com/help/privacy-policy"
					rel="noopener noreferrer"
				>
					Privacy Policy
				</Link>
				.
			</span>{' '}
			{useCaptcha && (
				<span>
					We use Google reCAPTCHA to protect our website and the
					Google{' '}
					<Link
						data-ignore="global-link-styling"
						href="https://policies.google.com/privacy"
						rel="noopener noreferrer"
					>
						Privacy Policy
					</Link>{' '}
					and{' '}
					<Link
						data-ignore="global-link-styling"
						href="https://policies.google.com/terms"
						rel="noopener noreferrer"
					>
						Terms of Service
					</Link>{' '}
					apply.
				</span>
			)}
		</p>
	);
};

// ----- Exports ----- //

export default PrivacyWording;