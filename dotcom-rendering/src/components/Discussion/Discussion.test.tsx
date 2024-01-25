import '@testing-library/jest-dom/extend-expect';
import {
	render,
	screen,
	waitForElementToBeRemoved,
} from '@testing-library/react';
import { mockRESTCalls } from '../../lib/mockRESTCalls';
import { Discussion } from '../Discussion';

mockRESTCalls();

describe('App', () => {
	it('should not render the comment form if user is logged out', async () => {
		render(
			<Discussion
				user={undefined}
				discussionApiUrl="https://discussion.theguardian.com/discussion-api"
				shortUrlId="p/39f5z"
				discussionD2Uid="testD2Header"
				discussionApiClientHeader="testClientHeader"
				enableDiscussionSwitch={true}
				idApiUrl="https://idapi.theguardian.com"
			/>,
		);

		await waitForElementToBeRemoved(() =>
			screen.getByTestId('loading-comments'),
		);

		expect(screen.queryAllByText('jamesgorrie').length).toBeGreaterThan(0);
		expect(screen.queryByPlaceholderText('Join the discussion')).toBeNull();
	});
});