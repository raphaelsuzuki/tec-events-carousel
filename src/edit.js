
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	SelectControl,
	TextControl,
	ColorPicker,
	FormTokenField,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import './editor.scss';

export default function Edit( { attributes, setAttributes } ) {
	const {
		numberOfEvents,
		eventOrder,
		showDate,
		showVenue,
		showExcerpt,
		accentColor,
		sectionTitle,
		eventCategories,
		eventTags,
	} = attributes;

	const [ tribeActive, setTribeActive ] = useState( true );

	// Fetch available event categories.
	const eventCategoryTerms = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'tribe_events_cat', {
			per_page: 100,
			orderby: 'name',
			order: 'asc',
		} );
	}, [] );

	// Fetch available tags.
	const tagTerms = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag', {
			per_page: 100,
			orderby: 'name',
			order: 'asc',
		} );
	}, [] );

	// Build lookup maps for token fields.
	const categoryMap = useMemo( () => {
		if ( ! eventCategoryTerms ) return {};
		const map = {};
		eventCategoryTerms.forEach( ( t ) => {
			map[ t.id ] = t.name;
		} );
		return map;
	}, [ eventCategoryTerms ] );

	const tagMap = useMemo( () => {
		if ( ! tagTerms ) return {};
		const map = {};
		tagTerms.forEach( ( t ) => {
			map[ t.id ] = t.name;
		} );
		return map;
	}, [ tagTerms ] );

	const categoryNames = useMemo(
		() => ( eventCategoryTerms || [] ).map( ( t ) => t.name ),
		[ eventCategoryTerms ]
	);

	const tagNames = useMemo(
		() => ( tagTerms || [] ).map( ( t ) => t.name ),
		[ tagTerms ]
	);

	const selectedCategoryNames = useMemo(
		() =>
			( eventCategories || [] )
				.map( ( id ) => categoryMap[ id ] )
				.filter( Boolean ),
		[ eventCategories, categoryMap ]
	);

	const selectedTagNames = useMemo(
		() =>
			( eventTags || [] )
				.map( ( id ) => tagMap[ id ] )
				.filter( Boolean ),
		[ eventTags, tagMap ]
	);

	const events = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			const query = {
				per_page: numberOfEvents,
				_embed: true,
				status: 'publish',
			};

			if ( eventOrder === 'upcoming' ) {
				query.orderby = 'date';
				query.order = 'asc';
			} else {
				query.orderby = 'date';
				query.order = 'desc';
			}

			if ( eventCategories && eventCategories.length > 0 ) {
				query.tribe_events_cat = eventCategories;
			}

			if ( eventTags && eventTags.length > 0 ) {
				query.tags = eventTags;
			}

			const records = getEntityRecords( 'postType', 'tribe_events', query );
			return records;
		},
		[ numberOfEvents, eventOrder, eventCategories, eventTags ]
	);

	useEffect( () => {
		if ( events === null ) {
			setTribeActive( false );
		} else {
			setTribeActive( true );
		}
	}, [ events ] );

	const blockProps = useBlockProps( {
		className: 'telex-events-carousel-editor',
		style: { '--tec-accent': accentColor },
	} );

	const formatDate = ( dateString ) => {
		if ( ! dateString ) {
			return '';
		}
		const date = new Date( dateString );
		const options = { month: 'short', day: 'numeric', year: 'numeric' };
		return date.toLocaleDateString( 'en-US', options );
	};

	const getExcerpt = ( event ) => {
		if ( event.excerpt && event.excerpt.rendered ) {
			const div = document.createElement( 'div' );
			div.innerHTML = event.excerpt.rendered;
			const text = div.textContent || div.innerText || '';
			return text.length > 100 ? text.substring( 0, 100 ) + '…' : text;
		}
		return '';
	};

	const getFeaturedImage = ( event ) => {
		if (
			event._embedded &&
			event._embedded[ 'wp:featuredmedia' ] &&
			event._embedded[ 'wp:featuredmedia' ][ 0 ]
		) {
			const media = event._embedded[ 'wp:featuredmedia' ][ 0 ];
			if ( media.media_details && media.media_details.sizes ) {
				if ( media.media_details.sizes.medium_large ) {
					return media.media_details.sizes.medium_large.source_url;
				}
				if ( media.media_details.sizes.medium ) {
					return media.media_details.sizes.medium.source_url;
				}
			}
			return media.source_url || '';
		}
		return '';
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Carousel Settings', 'telex-events-carousel' ) }
					initialOpen={ true }
				>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Section Title', 'telex-events-carousel' ) }
						value={ sectionTitle }
						onChange={ ( value ) =>
							setAttributes( { sectionTitle: value } )
						}
					/>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Number of Events', 'telex-events-carousel' ) }
						value={ numberOfEvents }
						onChange={ ( value ) =>
							setAttributes( { numberOfEvents: value } )
						}
						min={ 1 }
						max={ 20 }
					/>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Event Order', 'telex-events-carousel' ) }
						value={ eventOrder }
						options={ [
							{
								label: __( 'Upcoming', 'telex-events-carousel' ),
								value: 'upcoming',
							},
							{
								label: __( 'Past', 'telex-events-carousel' ),
								value: 'past',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { eventOrder: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Filter by Taxonomy', 'telex-events-carousel' ) }
					initialOpen={ false }
				>
					{ eventCategoryTerms === null || eventCategoryTerms === undefined ? (
						<p style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<Spinner />
							{ __( 'Loading categories…', 'telex-events-carousel' ) }
						</p>
					) : eventCategoryTerms.length === 0 ? (
						<p style={ { color: '#757575', fontStyle: 'italic' } }>
							{ __( 'No event categories found.', 'telex-events-carousel' ) }
						</p>
					) : (
						<FormTokenField
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Event Categories', 'telex-events-carousel' ) }
							value={ selectedCategoryNames }
							suggestions={ categoryNames }
							onChange={ ( tokens ) => {
								const ids = tokens
									.map( ( name ) => {
										const term = ( eventCategoryTerms || [] ).find(
											( t ) => t.name.toLowerCase() === name.toLowerCase()
										);
										return term ? term.id : null;
									} )
									.filter( Boolean );
								setAttributes( { eventCategories: ids } );
							} }
							__experimentalExpandOnFocus
						/>
					) }
					{ tagTerms === null || tagTerms === undefined ? (
						<p style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<Spinner />
							{ __( 'Loading tags…', 'telex-events-carousel' ) }
						</p>
					) : tagTerms.length === 0 ? (
						<p style={ { color: '#757575', fontStyle: 'italic' } }>
							{ __( 'No tags found.', 'telex-events-carousel' ) }
						</p>
					) : (
						<FormTokenField
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Event Tags', 'telex-events-carousel' ) }
							value={ selectedTagNames }
							suggestions={ tagNames }
							onChange={ ( tokens ) => {
								const ids = tokens
									.map( ( name ) => {
										const term = ( tagTerms || [] ).find(
											( t ) => t.name.toLowerCase() === name.toLowerCase()
										);
										return term ? term.id : null;
									} )
									.filter( Boolean );
								setAttributes( { eventTags: ids } );
							} }
							__experimentalExpandOnFocus
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Display Options', 'telex-events-carousel' ) }
					initialOpen={ false }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show Date', 'telex-events-carousel' ) }
						checked={ showDate }
						onChange={ ( value ) =>
							setAttributes( { showDate: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show Venue', 'telex-events-carousel' ) }
						checked={ showVenue }
						onChange={ ( value ) =>
							setAttributes( { showVenue: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show Excerpt', 'telex-events-carousel' ) }
						checked={ showExcerpt }
						onChange={ ( value ) =>
							setAttributes( { showExcerpt: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Accent Color', 'telex-events-carousel' ) }
					initialOpen={ false }
				>
					<ColorPicker
						color={ accentColor }
						onChangeComplete={ ( color ) =>
							setAttributes( { accentColor: color.hex } )
						}
						disableAlpha
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ sectionTitle && (
					<h2 className="telex-events-carousel__title">
						{ sectionTitle }
					</h2>
				) }
				{ ! tribeActive && (
					<div className="telex-events-carousel__notice">
						<p>
							{ __(
								'The Events Calendar plugin is required. Please install and activate it to display events.',
								'telex-events-carousel'
							) }
						</p>
					</div>
				) }
				{ tribeActive && ! events && (
					<div className="telex-events-carousel__loading">
						<p>
							{ __( 'Loading events…', 'telex-events-carousel' ) }
						</p>
					</div>
				) }
				{ tribeActive && events && events.length === 0 && (
					<div className="telex-events-carousel__notice">
						<p>
							{ __(
								'No events found. Create some events in The Events Calendar to see them here.',
								'telex-events-carousel'
							) }
						</p>
					</div>
				) }
				{ tribeActive && events && events.length > 0 && (
					<div className="telex-events-carousel__track-wrapper">
						<div className="telex-events-carousel__track">
							{ events.map( ( event ) => {
								const imageUrl = getFeaturedImage( event );
								return (
									<div
										className="telex-events-carousel__card"
										key={ event.id }
									>
										<div className="telex-events-carousel__card-image">
											{ imageUrl ? (
												<img
													src={ imageUrl }
													alt={
														event.title.rendered ||
														''
													}
												/>
											) : (
												<div className="telex-events-carousel__card-placeholder">
													<span>{ __( '📅', 'telex-events-carousel' ) }</span>
												</div>
											) }
											<div className="telex-events-carousel__card-overlay">
												{ showDate && event.date && (
													<span className="telex-events-carousel__card-date">
														{ formatDate(
															event.date
														) }
													</span>
												) }
												<h3
													className="telex-events-carousel__card-name"
													dangerouslySetInnerHTML={ {
														__html: event.title
															.rendered,
													} }
												/>
												{ showVenue &&
													event.meta &&
													event.meta._EventVenueID && (
														<span className="telex-events-carousel__card-venue">
															{ __(
																'📍 Venue',
																'telex-events-carousel'
															) }
														</span>
													) }
												{ showExcerpt && (
													<p className="telex-events-carousel__card-excerpt">
														{ getExcerpt(
															event
														) }
													</p>
												) }
											</div>
										</div>
									</div>
								);
							} ) }
						</div>
					</div>
				) }
			</div>
		</>
	);
}
