import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import {
	FormTokenField,
	PanelBody,
	RangeControl,
	SelectControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

function formatEventDate( event ) {
	const startDate = event.meta?._EventStartDate || event.date;
	if ( ! startDate ) {
		return null;
	}

	const date = new Date( startDate.replace( ' ', 'T' ) );
	if ( Number.isNaN( date.getTime() ) ) {
		return null;
	}

	return {
		date: date.toLocaleDateString( 'en-US', {
			month: 'short',
			day: '2-digit',
		} ),
		day: date.toLocaleDateString( 'en-US', { weekday: 'short' } ),
		year: date.getFullYear(),
		time: date.toLocaleTimeString( 'en-US', {
			hour: 'numeric',
			minute: '2-digit',
		} ),
	};
}

function getExcerptText( event ) {
	if ( ! event.excerpt?.rendered ) {
		return '';
	}

	const excerpt = document.createElement( 'div' );
	excerpt.innerHTML = event.excerpt.rendered;
	return excerpt.textContent || excerpt.innerText || '';
}

function getEventTaxonomySubtitle( event, categoriesById, tagsById ) {
	const categoryNames = ( event.tribe_events_cat || [] )
		.map( ( id ) => categoriesById[ id ] )
		.filter( Boolean );
	const tagNames = ( event.tags || [] )
		.map( ( id ) => tagsById[ id ] )
		.filter( Boolean );
	const subtitles = [];

	if ( categoryNames.length ) {
		subtitles.push( categoryNames.join( ', ' ) );
	}
	if ( tagNames.length ) {
		subtitles.push( tagNames.join( ', ' ) );
	}

	return subtitles.join( ' | ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		numberOfEvents,
		eventOffset,
		eventOrder,
		eventCategories,
		eventTags,
		sectionTitle,
	} = attributes;
	const [ taxonomyTerms, setTaxonomyTerms ] = useState( null );
	const [ taxonomyError, setTaxonomyError ] = useState( false );

	useEffect( () => {
		let cancelled = false;
		const query = '?per_page=100&orderby=name&order=asc';

		Promise.all( [
			apiFetch( { path: `/wp/v2/tribe_events_cat${ query }` } ),
			apiFetch( { path: `/wp/v2/tags${ query }` } ),
		] )
			.then( ( [ categories, tags ] ) => {
				if ( ! cancelled ) {
					setTaxonomyTerms( { categories, tags } );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setTaxonomyError( true );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [] );

	const { events, tribeActive, totalEvents } = useSelect(
		( select ) => {
			const core = select( 'core' );
			const query = {
				per_page: numberOfEvents,
				offset: eventOffset,
				status: 'publish',
				orderby: 'date',
				order: eventOrder === 'upcoming' ? 'asc' : 'desc',
			};

			if ( eventCategories?.length ) {
				query.tribe_events_cat = eventCategories;
			}
			if ( eventTags?.length ) {
				query.tags = eventTags;
			}

			const records = core.getEntityRecords(
				'postType',
				'tribe_events',
				query
			);
			const totalItems = core.getEntityRecordsTotalItems(
				'postType',
				'tribe_events',
				query
			);
			const eventsWithVenues = records?.map( ( event ) => {
				const venueId = Number( event.meta?._EventVenueID );
				const venue = venueId
					? core.getEntityRecord( 'postType', 'tribe_venue', venueId )
					: null;
				const venueName = venue?.title?.rendered || '';
				const venueCity = venue?.meta?._VenueCity || '';

				return {
					...event,
					previewVenue: venueCity
						? `${ venueName } (${ venueCity })`
						: venueName,
					previewCost: event.meta?._EventCost || '',
				};
			} );

			return {
				events: records === null ? null : eventsWithVenues,
				totalEvents:
					typeof totalItems === 'number'
						? Math.max( 0, totalItems - eventOffset )
						: null,
				tribeActive: Boolean( core.getPostType( 'tribe_events' ) ),
			};
		},
		[ numberOfEvents, eventOffset, eventOrder, eventCategories, eventTags ]
	);

	const blockProps = useBlockProps( {
		className: 'tec-events-table-editor',
	} );
	const categories = taxonomyTerms?.categories || [];
	const tags = taxonomyTerms?.tags || [];
	const categoriesById = Object.fromEntries(
		categories.map( ( term ) => [ term.id, term.name ] )
	);
	const tagsById = Object.fromEntries(
		tags.map( ( term ) => [ term.id, term.name ] )
	);
	const selectedCategories = categories
		.filter( ( term ) => eventCategories.includes( term.id ) )
		.map( ( term ) => term.name );
	const selectedTags = tags
		.filter( ( term ) => eventTags.includes( term.id ) )
		.map( ( term ) => term.name );

	const updateTerms = ( tokens, terms, attribute ) => {
		const ids = tokens
			.map(
				( name ) =>
					terms.find(
						( term ) =>
							term.name.toLowerCase() === name.toLowerCase()
					)?.id
			)
			.filter( Boolean );
		setAttributes( { [ attribute ]: ids } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Table Settings', 'tec-events-carousel' ) }
					initialOpen
				>
					<TextControl
						label={ __( 'Section Title', 'tec-events-carousel' ) }
						value={ sectionTitle }
						onChange={ ( value ) =>
							setAttributes( { sectionTitle: value } )
						}
					/>
					<RangeControl
						label={ __( 'Number of Events', 'tec-events-carousel' ) }
						value={ numberOfEvents }
						min={ 1 }
						max={ 20 }
						onChange={ ( value ) =>
							setAttributes( { numberOfEvents: value } )
						}
					/>
					<RangeControl
						label={ __( 'Skip Events', 'tec-events-carousel' ) }
						value={ eventOffset }
						min={ 0 }
						max={ 100 }
						onChange={ ( value ) =>
							setAttributes( { eventOffset: value } )
						}
					/>
					<SelectControl
						label={ __( 'Event Order', 'tec-events-carousel' ) }
						value={ eventOrder }
						options={ [
							{
								label: __( 'Upcoming', 'tec-events-carousel' ),
								value: 'upcoming',
							},
							{
								label: __( 'Past', 'tec-events-carousel' ),
								value: 'past',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { eventOrder: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Filter by Taxonomy', 'tec-events-carousel' ) }
					initialOpen={ false }
				>
					{ taxonomyError ? (
						<p>
							{ __(
								'Taxonomy terms could not be loaded.',
								'tec-events-carousel'
							) }
						</p>
					) : taxonomyTerms === null ? (
						<p className="tec-events-table-editor__loading">
							<Spinner />
							{ __( 'Loading filters…', 'tec-events-carousel' ) }
						</p>
					) : (
						<>
							<FormTokenField
								label={ __(
									'Event Categories',
									'tec-events-carousel'
								) }
								value={ selectedCategories }
								suggestions={ categories.map(
									( term ) => term.name
								) }
								onChange={ ( tokens ) =>
									updateTerms(
										tokens,
										categories,
										'eventCategories'
									)
								}
								__experimentalExpandOnFocus
							/>
							<FormTokenField
								label={ __( 'Event Tags', 'tec-events-carousel' ) }
								value={ selectedTags }
								suggestions={ tags.map(
									( term ) => term.name
								) }
								onChange={ ( tokens ) =>
									updateTerms( tokens, tags, 'eventTags' )
								}
								__experimentalExpandOnFocus
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<header className="tec-events-table__header">
					<div>
						<h2 className="tec-events-table__title">
							{ sectionTitle }
							{ typeof totalEvents === 'number' && (
								<span>
									[
									{ totalEvents }{ ' ' }
									{ __(
										'CONFIRMED DATES',
										'tec-events-carousel'
									) }
									]
								</span>
							) }
						</h2>
					</div>
					<a className="tec-events-table__archive" href="#">
						{ __( 'View All Events', 'tec-events-carousel' ) }
						<span aria-hidden="true">→</span>
					</a>
				</header>

				{ ! tribeActive ? (
					<p className="tec-events-table__notice">
						{ __(
							'The Events Calendar plugin is required to display events.',
							'tec-events-carousel'
						) }
					</p>
				) : events === null ? (
					<p className="tec-events-table__notice">
						<Spinner />
						{ __( 'Loading events…', 'tec-events-carousel' ) }
					</p>
				) : events.length === 0 ? (
					<p className="tec-events-table__notice">
						{ __( 'No events found.', 'tec-events-carousel' ) }
					</p>
				) : (
					<div className="tec-events-table__scroll">
						<table>
							<thead>
								<tr>
									<th scope="col">
										{ __( 'Date and Time', 'tec-events-carousel' ) }
									</th>
									<th scope="col">
										{ __(
											'Event Billing and Attractions',
											'tec-events-carousel'
										) }
									</th>
									<th scope="col">
										{ __( 'Venue & City', 'tec-events-carousel' ) }
									</th>
									<th scope="col">
										{ __( 'Price', 'tec-events-carousel' ) }
									</th>
									<th scope="col">
										{ __(
											'Action',
											'tec-events-carousel'
										) }
									</th>
								</tr>
							</thead>
							<tbody>
								{ events.map( ( event ) => {
									const date = formatEventDate( event );
									const taxonomySubtitle = getEventTaxonomySubtitle(
										event,
										categoriesById,
										tagsById
									);
									return (
										<tr key={ event.id }>
											<td data-label="Date and Time">
												<strong>
													{ date?.date || '—' }
												</strong>
												<span>
													{ date?.day || '' }{ ' ' }
													{ date?.year || '' }
												</span>
												{ date?.time && <span>{ date.time }</span> }
											</td>
											<td data-label="Event Billing and Attractions">
												<strong
													dangerouslySetInnerHTML={ {
														__html: event.title.rendered,
													} }
												/>
												{ taxonomySubtitle && (
													<span className="tec-events-table__terms">
														{ taxonomySubtitle }
													</span>
												) }
												{ event.excerpt?.rendered && (
													<span
														className="tec-events-table__excerpt"
													>
														{ getExcerptText( event ) }
													</span>
												) }
											</td>
											<td data-label="Venue & City">
												{ event.previewVenue || '—' }
											</td>
											<td data-label="Price">
												{ event.previewCost || '—' }
											</td>
											<td data-label="Action">
												<span className="tec-events-table__button">
													{ __(
														'VIEW DETAILS',
														'tec-events-carousel'
													) }
												</span>
											</td>
										</tr>
									);
								} ) }
							</tbody>
						</table>
					</div>
				) }
			</div>
		</>
	);
}