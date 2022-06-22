import { css } from '@emotion/react';
import { neutral, space, until } from '@guardian/source-foundations';
import {
	Button,
	InlineError,
	InlineSuccess,
	Link,
	SvgReload,
	SvgSpinner,
} from '@guardian/source-react-components';
import type { ReactEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import type { OphanAction } from '../browser/ophan/ophan';
import {
	getOphanRecordFunction,
	submitComponentEvent,
} from '../browser/ophan/ophan';

// The Google documentation specifies that if the 'recaptcha-badge' is hidden,
// their T+C's must be displayed instead. While this component hides the
// badge, its parent must include the T+C along side it.
// The T+C are not included in this componet directly to reduce layout shift
// from the island hydrating (placeholder height for the text can't
// be accurately predicated for every breakpoint).
// https://developers.google.com/recaptcha/docs/faq#id-like-to-hide-the-recaptcha-badge.-what-is-allowed

type Props = {
	styles: string;
	html: string;
	newsletterId: string;
	successText: string;
};

const ErrorMessageWithAdvice = (props: { text?: string }) => (
	<InlineError>
		<div
			css={css`
				display: flex;
			`}
		>
			<span>
				{props.text} Please try again or contact{' '}
				<Link href="mailto:userhelp@theguardian.com" target="_blank">
					userhelp@theguardian.com
				</Link>
			</span>
		</div>
	</InlineError>
);

const SuccessMessage = (props: { text?: string }) => (
	<InlineSuccess>
		<b>Subscription Confirmed.&nbsp;</b>
		<span>{props.text}</span>
	</InlineSuccess>
);

const buildFormData = (
	emailAddress: string,
	newsletterId: string,
	token: string,
): FormData => {
	const pageRef = window.location.origin + window.location.pathname;
	const refViewId = window.guardian.ophan?.pageViewId ?? '';

	const formData = new FormData();
	formData.append('email', emailAddress);
	formData.append('csrfToken', ''); //TO DO - do we need this? how do we get it?
	formData.append('listName', newsletterId);
	formData.append('ref', pageRef);
	formData.append('refViewId', refViewId);
	formData.append('name', '');
	if (window.guardian.config.switches.emailSignupRecaptcha) {
		formData.append('g-recaptcha-response', token); //  TO DO -  find out if field is required/allowed by form handler
	}

	return formData;
};

const postFormData = async (
	endpoint: string,
	formData: FormData,
): Promise<Response> => {
	const requestBodyStrings: string[] = [];

	formData.forEach((value, key) => {
		requestBodyStrings.push(
			`${encodeURIComponent(key)}=${encodeURIComponent(
				value.toString(),
			)}`,
		);
	});

	return fetch(endpoint, {
		method: 'POST',
		body: requestBodyStrings.join('&'),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	});
};

const sendTracking = (
	newsletterId: string,
	event:
		| 'click-button'
		| 'submit-form'
		| 'form-submit-error'
		| 'captcha-load-error'
		| 'open-captcha'
		| 'captcha-not-passed'
		| 'captcha-passed'
		| 'success-response-received'
		| 'fail-response-received',
): void => {
	const ophanRecord = getOphanRecordFunction();

	let action: OphanAction = 'CLICK';
	const value = `${event} ${newsletterId}`;

	switch (event) {
		case 'submit-form':
			action = 'SUBSCRIBE';
			break;
		case 'open-captcha':
			action = 'EXPAND';
			break;
		case 'form-submit-error':
		case 'captcha-load-error':
			action = 'CLOSE';
			break;
		case 'captcha-not-passed':
		case 'captcha-passed':
			action = 'ANSWER';
			break;
		case 'success-response-received':
		case 'fail-response-received':
			action = 'RETURN';
			break;
		case 'click-button':
		default:
			action = 'CLICK';
			break;
	}

	submitComponentEvent(
		{
			action,
			value,
			component: {
				componentType: 'NEWSLETTER_SUBSCRIPTION',
				id: `DCR SecureSignupIframe ${newsletterId}`,
			},
		},
		ophanRecord,
	);
};

export const SecureSignupIframe = ({
	styles,
	html,
	newsletterId,
	successText,
}: Props) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const recaptchaRef = useRef<ReCAPTCHA>(null);

	const [iframeHeight, setIFrameHeight] = useState<number>(0);
	const [isWaitingForResponse, setIsWaitingForResponse] =
		useState<boolean>(false);
	const [captchaSiteKey, setCaptchaSiteKey] = useState<string>('');
	const [responseText, setResponseText] = useState<string | undefined>(
		undefined,
	);
	const [responseOk, setResponseOk] = useState<boolean | undefined>(
		undefined,
	);
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);

	const hasResponse = typeof responseOk === 'boolean';

	const submitForm = async (token: string): Promise<void> => {
		const { current: iframe } = iframeRef;
		const input: HTMLInputElement | null =
			iframe?.contentDocument?.querySelector('input[type="email"]') ??
			null;
		const emailAddress: string = input?.value ?? '';

		sendTracking(newsletterId, 'submit-form');
		const response = await postFormData(
			window.guardian.config.page.ajaxUrl + '/email',
			buildFormData(emailAddress, newsletterId, token),
		);
		const text = await response.text();
		setIsWaitingForResponse(false);
		setResponseText(text);
		setResponseOk(response.ok);

		sendTracking(
			newsletterId,
			response.ok
				? 'success-response-received'
				: 'fail-response-received',
		);
	};

	const resetForm: ReactEventHandler<HTMLButtonElement> = () => {
		setErrorMessage(undefined);
		setResponseOk(undefined);
		setResponseText(undefined);
		recaptchaRef.current?.reset();
	};

	const handleCaptchaLoadError: ReactEventHandler<HTMLDivElement> = () => {
		sendTracking(newsletterId, 'captcha-load-error');
		setErrorMessage(`Sorry, the reCAPTCHA failed to load.`);
		recaptchaRef.current?.reset();
	};

	const handleCaptchaComplete = (token: string | null) => {
		if (!token) {
			sendTracking(newsletterId, 'captcha-not-passed');
			return;
		}
		sendTracking(newsletterId, 'captcha-passed');
		setIsWaitingForResponse(true);
		submitForm(token).catch((error) => {
			// eslint-disable-next-line no-console -- unexpected error
			console.error(error);
			sendTracking(newsletterId, 'form-submit-error');
			setErrorMessage(`Sorry, there was an error signing you up.`);
			setIsWaitingForResponse(false);
		});
	};

	const resizeIframe = (requestedHeight = 0): void => {
		const { current: iframe } = iframeRef;
		if (!iframe) {
			return;
		}
		// verifiying the body is present before accessing the scrollHeight is necessary
		// iframe.contentDocument?.body.scrollHeight can cause a TypeError
		// the typing assumes body is always present on a Document but the use of
		// srcDoc seems to allow the document to exist without the body.

		const body = iframe.contentDocument?.body;
		const scrollHeight = body ? body.scrollHeight : 0;
		setIFrameHeight(Math.max(0, requestedHeight, scrollHeight + 15));
	};

	const resetIframeHeight = (): void => {
		resizeIframe();
	};

	const handleClickInIFrame = (): void => {
		sendTracking(newsletterId, 'click-button');
	};

	const handleSubmitInIFrame = (event: Event): void => {
		event.preventDefault();
		if (isWaitingForResponse) {
			return;
		}
		setErrorMessage(undefined);
		sendTracking(newsletterId, 'open-captcha');
		recaptchaRef.current?.execute();
	};

	const attachListenersToIframe = () => {
		const { current: iframe } = iframeRef;
		iframe?.contentWindow?.addEventListener('resize', resetIframeHeight);
		const form = iframe?.contentDocument?.querySelector('form');
		const button = iframe?.contentDocument?.querySelector('button');
		button?.addEventListener('click', handleClickInIFrame);
		form?.addEventListener('submit', handleSubmitInIFrame);
		resetIframeHeight();
	};

	// read siteKey
	useEffect(() => {
		setCaptchaSiteKey(
			window.guardian.config.page.googleRecaptchaSiteKey ?? '',
		);
	}, []);

	return (
		<>
			<iframe
				ref={iframeRef}
				css={css`
					width: 100%;
					min-height: 90px;
					overflow: hidden;
				`}
				style={{
					height: iframeHeight,
					display:
						hasResponse || isWaitingForResponse ? 'none' : 'block',
				}}
				srcDoc={`
				<html>
					<head>
						${styles}
					</head>
					<body style="margin: 0;">${html}</body>
				</html>`}
				onLoad={attachListenersToIframe}
			/>

			{isWaitingForResponse && (
				<div>
					<SvgSpinner isAnnouncedByScreenReader={true} size="small" />
				</div>
			)}

			{errorMessage && <ErrorMessageWithAdvice text={errorMessage} />}

			{hasResponse &&
				(responseOk ? (
					<div>
						<SuccessMessage text={successText} />
					</div>
				) : (
					<div
						css={css`
							display: flex;
							align-items: flex-start;
							${until.tablet} {
								flex-wrap: wrap;
							}
							button {
								margin-left: ${space[1]}px;
								background-color: ${neutral[0]};
								:hover {
									background-color: ${neutral[20]};
								}
							}
						`}
					>
						<ErrorMessageWithAdvice
							text={`Sign up failed: ${responseText ?? ''}.`}
						/>
						<Button
							size="small"
							icon={<SvgReload />}
							iconSide={'right'}
							onClick={resetForm}
						>
							Try again
						</Button>
					</div>
				))}

			{captchaSiteKey && (
				<div
					css={css`
						.grecaptcha-badge {
							visibility: hidden;
						}
					`}
				>
					<ReCAPTCHA // TO DO - EXPIRED callback
						sitekey={captchaSiteKey}
						ref={recaptchaRef}
						onChange={handleCaptchaComplete}
						onError={handleCaptchaLoadError}
						size="invisible"
					/>
				</div>
			)}
		</>
	);
};
