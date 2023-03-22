import { SendAMessage } from './SendAMessage.importable';
import { Section } from './Section';
import { MessageForm } from '../../../fixtures/manual/message-us-form';
import { ArticleDisplay, ArticleDesign, ArticlePillar } from '@guardian/libs';

export default {
	component: SendAMessage,
	title: 'Components/MessageUs',
	parameters: {
		chromatic: { diffThreshold: 0.2 },
	},
};

const defaultFormat = {
	display: ArticleDisplay.Standard,
	design: ArticleDesign.Standard,
	theme: ArticlePillar.News,
};

export const Default = () => {
	return (
		<Section>
			<SendAMessage
				formFields={MessageForm.formFields}
				formId={MessageForm.formId}
				format={defaultFormat}
				pageId=""
			/>
		</Section>
	);
};
Default.story = { name: 'default' };