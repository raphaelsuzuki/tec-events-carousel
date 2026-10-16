<?php
/**
 * Render callback for the Events Table block.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 */

$number_of_events = isset( $attributes['numberOfEvents'] ) ? min( 20, max( 1, absint( $attributes['numberOfEvents'] ) ) ) : 6;
$event_order      = isset( $attributes['eventOrder'] ) ? sanitize_text_field( $attributes['eventOrder'] ) : 'upcoming';
$section_title    = isset( $attributes['sectionTitle'] ) ? sanitize_text_field( $attributes['sectionTitle'] ) : '';
$event_categories = ! empty( $attributes['eventCategories'] ) ? array_map( 'absint', (array) $attributes['eventCategories'] ) : array();
$event_tags       = ! empty( $attributes['eventTags'] ) ? array_map( 'absint', (array) $attributes['eventTags'] ) : array();

if ( ! post_type_exists( 'tribe_events' ) ) {
	printf(
		'<div %s><p class="tec-events-table__notice">%s</p></div>',
		get_block_wrapper_attributes(),
		esc_html__( 'The Events Calendar plugin is required to display events.', 'tec-events-carousel' )
	);
	return;
}

$now = current_time( 'Y-m-d H:i:s' );

$query_args = array(
	'post_type'      => 'tribe_events',
	'post_status'    => 'publish',
	'posts_per_page' => $number_of_events,
	'no_found_rows'  => true,
);

$tax_query = array();

if ( ! empty( $event_categories ) ) {
	$tax_query[] = array(
		'taxonomy' => 'tribe_events_cat',
		'field'    => 'term_id',
		'terms'    => $event_categories,
	);
}

if ( ! empty( $event_tags ) ) {
	$tax_query[] = array(
		'taxonomy' => 'post_tag',
		'field'    => 'term_id',
		'terms'    => $event_tags,
	);
}

if ( count( $tax_query ) > 1 ) {
	$tax_query['relation'] = 'AND';
}

if ( ! empty( $tax_query ) ) {
	$query_args['tax_query'] = $tax_query;
}

$hide_from_listings_clause = array(
	'relation' => 'OR',
	array(
		'key'     => '_EventHideFromUpcoming',
		'compare' => 'NOT EXISTS',
	),
	array(
		'key'     => '_EventHideFromUpcoming',
		'value'   => 'yes',
		'compare' => '!=',
	),
);

if ( 'past' === $event_order ) {
	$query_args['meta_key']   = '_EventStartDate';
	$query_args['orderby']    = 'meta_value';
	$query_args['order']      = 'DESC';
	$query_args['meta_query'] = array(
		'relation' => 'AND',
		array(
			'key'     => '_EventStartDate',
			'value'   => $now,
			'compare' => '<',
			'type'    => 'DATETIME',
		),
		$hide_from_listings_clause,
	);
} else {
	$query_args['meta_key']   = '_EventStartDate';
	$query_args['orderby']    = 'meta_value';
	$query_args['order']      = 'ASC';
	$query_args['meta_query'] = array(
		'relation' => 'AND',
		array(
			'key'     => '_EventStartDate',
			'value'   => $now,
			'compare' => '>=',
			'type'    => 'DATETIME',
		),
		$hide_from_listings_clause,
	);
}

$events_query = new WP_Query( $query_args );
$calendar_url = function_exists( 'tribe_get_events_link' ) ? tribe_get_events_link() : get_post_type_archive_link( 'tribe_events' );
?>
<div <?php echo get_block_wrapper_attributes(); ?>>
	<header class="tec-events-table__header">
		<div>
			<h2 class="tec-events-table__title">
				<?php echo esc_html( $section_title ); ?>
				<?php if ( $events_query->post_count > 0 ) : ?>
					<span>[<?php echo esc_html( (string) $events_query->post_count ); ?> <?php esc_html_e( 'CONFIRMED DATES', 'tec-events-carousel' ); ?>]</span>
				<?php endif; ?>
			</h2>
		</div>
		<?php if ( $calendar_url ) : ?>
			<a class="tec-events-table__archive" href="<?php echo esc_url( $calendar_url ); ?>">
				<?php esc_html_e( 'View All Events', 'tec-events-carousel' ); ?>
				<span aria-hidden="true">&rarr;</span>
			</a>
		<?php endif; ?>
	</header>

	<?php if ( ! $events_query->have_posts() ) : ?>
		<p class="tec-events-table__notice"><?php esc_html_e( 'No events found.', 'tec-events-carousel' ); ?></p>
	<?php else : ?>
		<div class="tec-events-table__scroll">
			<table>
				<caption class="screen-reader-text"><?php echo esc_html( $section_title ); ?></caption>
				<thead>
					<tr>
						<th scope="col"><?php esc_html_e( 'Date and Time', 'tec-events-carousel' ); ?></th>
						<th scope="col"><?php esc_html_e( 'Event Billing and Attractions', 'tec-events-carousel' ); ?></th>
						<th scope="col"><?php esc_html_e( 'Venue & City', 'tec-events-carousel' ); ?></th>
						<th scope="col"><?php esc_html_e( 'Price', 'tec-events-carousel' ); ?></th>
						<th scope="col"><?php esc_html_e( 'Action', 'tec-events-carousel' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php
					while ( $events_query->have_posts() ) :
						$events_query->the_post();
						$event_id   = get_the_ID();
						$start_date = get_post_meta( $event_id, '_EventStartDate', true );
						$venue_id   = absint( get_post_meta( $event_id, '_EventVenueID', true ) );
						$venue_post = $venue_id ? get_post( $venue_id ) : null;
						$venue_city = $venue_id ? get_post_meta( $venue_id, '_VenueCity', true ) : '';
						$event_cost = function_exists( 'tribe_get_cost' ) ? tribe_get_cost( $event_id, true ) : get_post_meta( $event_id, '_EventCost', true );
						$excerpt    = wp_trim_words( wp_strip_all_tags( get_the_excerpt( $event_id ) ), 16 );
						$category_terms = get_the_terms( $event_id, 'tribe_events_cat' );
						$tag_terms      = get_the_terms( $event_id, 'post_tag' );
						$event_subtitle = array();

						if ( is_array( $category_terms ) ) {
							$event_subtitle[] = implode( ', ', wp_list_pluck( $category_terms, 'name' ) );
						}

						if ( is_array( $tag_terms ) ) {
							$event_subtitle[] = implode( ', ', wp_list_pluck( $tag_terms, 'name' ) );
						}

						$event_link = get_permalink( $event_id );
						$has_tickets = function_exists( 'tribe_events_has_tickets' ) && tribe_events_has_tickets( $event_id );
						$timestamp  = $start_date ? strtotime( $start_date ) : false;
						?>
						<tr>
							<td data-label="<?php esc_attr_e( 'Date and Time', 'tec-events-carousel' ); ?>">
								<?php if ( $timestamp ) : ?>
									<time datetime="<?php echo esc_attr( mysql2date( 'c', $start_date ) ); ?>">
										<strong><?php echo esc_html( date_i18n( 'M j', $timestamp ) ); ?></strong>
										<span><?php echo esc_html( date_i18n( 'D Y', $timestamp ) ); ?><?php echo esc_html( ' ' . date_i18n( get_option( 'time_format' ), $timestamp ) ); ?></span>
									</time>
								<?php else : ?>
										&mdash;
								<?php endif; ?>
							</td>
							<td data-label="<?php esc_attr_e( 'Event Billing and Attractions', 'tec-events-carousel' ); ?>">
								<strong><?php echo esc_html( get_the_title( $event_id ) ); ?></strong>
								<?php if ( ! empty( $event_subtitle ) ) : ?>
									<span class="tec-events-table__terms"><?php echo esc_html( implode( ' | ', $event_subtitle ) ); ?></span>
								<?php endif; ?>
								<?php if ( $excerpt ) : ?>
									<span class="tec-events-table__excerpt"><?php echo esc_html( $excerpt ); ?></span>
								<?php endif; ?>
							</td>
							<td data-label="<?php esc_attr_e( 'Venue & City', 'tec-events-carousel' ); ?>">
								<?php if ( $venue_post ) : ?>
									<strong><?php echo esc_html( $venue_post->post_title ); ?></strong>
									<?php if ( $venue_city ) : ?>
										<span class="tec-events-table__city"><?php echo esc_html( $venue_city ); ?></span>
									<?php endif; ?>
								<?php else : ?>
									&mdash;
								<?php endif; ?>
							</td>
							<td data-label="<?php esc_attr_e( 'Price', 'tec-events-carousel' ); ?>">
								<?php echo '' !== (string) $event_cost ? esc_html( (string) $event_cost ) : '&mdash;'; ?>
							</td>
							<td data-label="<?php esc_attr_e( 'Action', 'tec-events-carousel' ); ?>">
								<a class="tec-events-table__button" href="<?php echo esc_url( $event_link ); ?>">
									<?php
									if ( $has_tickets ) {
										esc_html_e( 'GET TICKETS', 'tec-events-carousel' );
									} else {
										esc_html_e( 'VIEW DETAILS', 'tec-events-carousel' );
									}
									?>
								</a>
							</td>
						</tr>
					<?php endwhile; ?>
				</tbody>
			</table>
		</div>
	<?php endif; ?>
	<?php wp_reset_postdata(); ?>
</div>