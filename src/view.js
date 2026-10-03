
document.addEventListener( 'DOMContentLoaded', () => {
	const carousels = document.querySelectorAll(
		'.wp-block-tec-events-carousel-carousel'
	);

	const isTouchDevice =
		window.matchMedia( '(hover: none) and (pointer: coarse)' ).matches;

	carousels.forEach( ( carousel ) => {
		const track = carousel.querySelector(
			'.tec-events-carousel__track'
		);
		const leftBtn = carousel.querySelector(
			'.tec-events-carousel__nav--left'
		);
		const rightBtn = carousel.querySelector(
			'.tec-events-carousel__nav--right'
		);

		if ( ! track ) {
			return;
		}

		// Touch: tap a card to reveal full overlay; tap again to navigate.
		if ( isTouchDevice ) {
			const cards = track.querySelectorAll(
				'.tec-events-carousel__card'
			);

			cards.forEach( ( card ) => {
				card.addEventListener( 'click', ( e ) => {
					if ( ! card.classList.contains( 'is-tapped' ) ) {
						// First tap: reveal details, prevent navigation.
						e.preventDefault();
						cards.forEach( ( c ) =>
							c.classList.remove( 'is-tapped' )
						);
						card.classList.add( 'is-tapped' );
					}
					// Second tap: default link behaviour proceeds.
				} );
			} );

			// Dismiss tapped state when tapping outside any card.
			document.addEventListener( 'click', ( e ) => {
				if ( ! e.target.closest( '.tec-events-carousel__card' ) ) {
					cards.forEach( ( c ) =>
						c.classList.remove( 'is-tapped' )
					);
				}
			} );
		}

		const getScrollAmount = () => {
			const card = track.querySelector(
				'.tec-events-carousel__card'
			);
			if ( ! card ) {
				return 300;
			}
			const cardWidth = card.offsetWidth;
			const gap = parseFloat(
				getComputedStyle( track ).gap
			) || 8;
			const visibleCards = Math.floor(
				track.offsetWidth / ( cardWidth + gap )
			);
			return ( cardWidth + gap ) * Math.max( visibleCards - 1, 1 );
		};

		if ( leftBtn ) {
			leftBtn.addEventListener( 'click', () => {
				track.scrollBy( {
					left: -getScrollAmount(),
					behavior: 'smooth',
				} );
			} );
		}

		if ( rightBtn ) {
			rightBtn.addEventListener( 'click', () => {
				track.scrollBy( {
					left: getScrollAmount(),
					behavior: 'smooth',
				} );
			} );
		}

		// Keyboard support for horizontal scrolling.
		carousel.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'ArrowLeft' ) {
				e.preventDefault();
				track.scrollBy( {
					left: -getScrollAmount(),
					behavior: 'smooth',
				} );
			} else if ( e.key === 'ArrowRight' ) {
				e.preventDefault();
				track.scrollBy( {
					left: getScrollAmount(),
					behavior: 'smooth',
				} );
			}
		} );
	} );
} );
