/* eslint-disable no-undef */
/* eslint-disable func-names */
import { mockApi } from '../../lib/mocks';
import { disableCMP } from '../../lib/disableCMP';
import { setLocalBaseUrl } from '../../lib/setLocalBaseUrl.js';

const articleUrl =
	'https://www.theguardian.com/artanddesign/2022/dec/26/a-lighter-side-of-life-picture-essay';

const liveblogUrl =
	'https://www.theguardian.com/science/live/2021/feb/19/mars-landing-nasa-perseverance-rover-briefing-latest-live-news-updates';

describe('Lightbox', function () {
	beforeEach(function () {
		disableCMP();
		setLocalBaseUrl();
	});

	it('should open the lightbox when an expand button is clicked', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('dialog#gu-lightbox').should('not.be.visible');
		// Open lightbox using the second button on the page (the first is main media)
		cy.get('button.open-lightbox').eq(1).realClick();
		cy.get('dialog#gu-lightbox').should('be.visible');
		// We expect the second image to be showing because the first is the main media
		// which doesn't have a button in this case because it's an immersive article.
		cy.get('nav [data-cy="lightbox-selected"]').contains('2/22');
		cy.get('li[data-index="2"] img').should('be.visible');
	});

	it('should open the lightbox when an image is clicked', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('dialog#gu-lightbox').should('not.be.visible');
		// Open lightbox using fifth image on the page
		cy.get('article img').eq(3).realClick();
		cy.get('dialog#gu-lightbox').should('be.visible');
		cy.get('nav [data-cy="lightbox-selected"]').contains('5/22');
		cy.get('li[data-index="5"] img').should('be.visible');
	});

	it('should trap focus', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('article img').first().realClick();
		cy.get('dialog#gu-lightbox').should('be.visible');
		cy.get('button.close').should('have.focus');
		cy.get('button.previous').should('not.have.focus');
		cy.realPress('Tab');
		cy.get('button.previous').should('have.focus');
		cy.realPress('Tab');
		cy.realPress('Tab');
		cy.get('button.info').should('have.focus');
		cy.realPress('Tab');
		// This is where focus should wrap back
		cy.get('button.info').should('not.have.focus');
		cy.get('button.close').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.previous').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.next').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.info').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.close').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.previous').should('have.focus');
		cy.realPress('Tab');
		cy.get('button.next').should('have.focus');
	});

	it('should respond to keyboard shortcuts and image clicks', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('dialog#gu-lightbox').should('not.be.visible');
		// Open lightbox using the second button on the page (the first is main media)
		cy.get('button.open-lightbox').eq(1).realClick();
		cy.get('dialog#gu-lightbox').should('be.visible');
		// Close lightbox using q key
		cy.realPress('q');
		cy.get('dialog#gu-lightbox').should('not.be.visible');
		// Pressing enter reopens the lightbox because focus was
		// restored to the open lightbox button
		cy.realPress('Enter');
		cy.get('dialog#gu-lightbox').should('be.visible');
		// We should be able to navigate using arrow keys
		cy.get('li[data-index="3"]').should('not.be.visible');
		cy.realPress('ArrowRight');
		cy.get('li[data-index="3"]').should('be.visible');
		cy.realPress('ArrowRight');
		cy.get('li[data-index="3"]').should('not.be.visible');
		cy.get('li[data-index="4"]').should('be.visible');
		cy.realPress('ArrowRight');
		cy.realPress('ArrowRight');
		cy.realPress('ArrowRight');
		cy.get('li[data-index="7"]').should('be.visible');
		cy.realPress('ArrowLeft');
		cy.get('li[data-index="6"]').should('be.visible');
		cy.realPress('ArrowLeft');
		cy.realPress('ArrowLeft');
		cy.realPress('ArrowLeft');
		cy.realPress('ArrowLeft');
		cy.realPress('ArrowLeft');
		// Going further back from position 1 should take us
		// round to the end and vice versa
		cy.realPress('ArrowLeft');
		cy.get('li[data-index="22"]').should('be.visible');
		cy.realPress('ArrowRight');
		cy.get('li[data-index="1"]').should('be.visible');
		// Showing and hiding the info caption using 'i'
		cy.get('li[data-index="1"] aside').should('be.visible');
		cy.realPress('i');
		cy.get('li[data-index="1"] aside').should('not.be.visible');
		cy.realPress('i');
		cy.get('li[data-index="1"] aside').should('be.visible');
		// Showing and hiding the caption by clicking
		cy.get('li[data-index="1"] picture').click();
		cy.get('li[data-index="1"] aside').should('not.be.visible');
		cy.get('li[data-index="1"] picture').click();
		cy.get('li[data-index="1"] aside').should('be.visible');
		// Showing and hiding using arrow keys
		cy.realPress('ArrowDown');
		cy.get('li[data-index="1"] aside').should('not.be.visible');
		cy.realPress('ArrowUp');
		cy.get('li[data-index="1"] aside').should('be.visible');
		// Closing the dialog using escape
		cy.realPress('Escape');
		cy.get('dialog#gu-lightbox').should('not.be.visible');
	});

	it('should download adjacent images before they are viewed', function () {
		/** A mini abstraction to make this particular test more readable */
		function image(position) {
			return cy.get(`li[data-index="${position}"] img`);
		}
		cy.visit(`/Article?url=${articleUrl}`);
		// eq(6) here means the 7th button is clicked (base zero you
		// see)
		cy.get('button.open-lightbox').eq(6).click();
		// We validate that adjacent images get downloaded early by checking the
		// value of the `loading` attribute
		image(5).should('have.attr', 'loading', 'lazy');
		image(6).should('have.attr', 'loading', 'eager');
		image(7).should('be.visible');
		image(8).should('have.attr', 'loading', 'eager');
		image(9).should('have.attr', 'loading', 'lazy');
		// Move to the next image - position 8
		cy.realPress('ArrowRight');
		image(6).should('have.attr', 'loading', 'eager'); // Once eager, it stays this way
		image(7).should('have.attr', 'loading', 'eager');
		image(8).should('be.visible');
		image(9).should('have.attr', 'loading', 'eager');
		image(10).should('have.attr', 'loading', 'lazy');
		// Move to the next image - position 9
		cy.realPress('ArrowRight');
		image(10).should('have.attr', 'loading', 'eager');
		image(11).should('have.attr', 'loading', 'lazy');
		// Move to the next image - position 10
		cy.realPress('ArrowRight');
		image(11).should('have.attr', 'loading', 'eager');
		image(12).should('have.attr', 'loading', 'lazy');
	});

	it('should remember my preference for showing the caption', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('button.open-lightbox').eq(1).realClick();
		// The info aside is visible by default
		cy.get('li[data-index="2"] aside').should('be.visible');
		// Clicking an image toggles the caption
		cy.get('li[data-index="2"] img').click();
		cy.get('li[data-index="2"] aside').should('not.be.visible');
		// Close lightbox
		cy.realPress('Escape');
		// Re-open lightbox to see if the info aside element is open by default
		cy.get('button.open-lightbox').eq(1).realPress('Space');
		cy.get('li[data-index="2"] aside').should('not.be.visible');
		// Close lightbox
		cy.realPress('Escape');
		// Reload the page to see if my preference for having the caption hidden
		// has been preserved
		cy.reload();
		cy.get('button.open-lightbox').eq(1).realClick();
		cy.get('dialog#gu-lightbox').should('be.visible');
		cy.get('li[data-index="2"] aside').should('not.be.visible');
		// Turn the info aside back on and then reload once more to check the
		// caption is again showing by default
		cy.realPress('i');
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('button.open-lightbox').eq(1).realClick();
		cy.get('li[data-index="2"] aside').should('be.visible');
	});

	it('should be possible to navigate by scrolling', function () {
		cy.visit(`/Article?url=${articleUrl}`);
		cy.get('button.open-lightbox').eq(1).realClick();
		cy.get('li[data-index="2"] img').should('be.visible');
		cy.get('li[data-index="5"]').scrollIntoView();
		cy.get('li[data-index="2"] img').should('not.be.visible');
		cy.get('li[data-index="5"] img').should('be.visible');
		cy.get('nav [data-cy="lightbox-selected"]').contains('5/22');
		cy.get('li[data-index="1"]').scrollIntoView();
		cy.get('li[data-index="1"] img').should('be.visible');
		cy.get('nav [data-cy="lightbox-selected"]').contains('1/22');
	});

	it('should navigate to the original block when clicking links in captions', function () {
		cy.visit(`/Article?url=${liveblogUrl}`);
		cy.get('button.open-lightbox').eq(1).realClick();
		// The info aside is visible by default
		cy.get('li[data-index="2"] aside').should('be.visible');
		// Click the caption link
		cy.get('li[data-index="2"] aside a').click();
		cy.url().should(
			'include',
			'?page=with:block-603007c48f08c3cb92a5ca74#block-603007c48f08c3cb92a5ca74',
		);
	});
});
