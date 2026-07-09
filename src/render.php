<?php
/**
 * Render callback for the Events Calendar Carousel block.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 */

$number_of_events = isset( $attributes['numberOfEvents'] ) ? absint( $attributes['numberOfEvents'] ) : 8;
$event_order      = isset( $attributes['eventOrder'] ) ? sanitize_text_field( $attributes['eventOrder'] ) : 'upcoming';
$show_date        = isset( $attributes['showDate'] ) ? (bool) $attributes['showDate'] : true;
$show_venue       = isset( $attributes['showVenue'] ) ? (bool) $attributes['showVenue'] : true;
$show_excerpt     = isset( $attributes['showExcerpt'] ) ? (bool) $attributes['showExcerpt'] : true;
$accent_color     = isset( $attributes['accentColor'] ) ? sanitize_hex_color( $attributes['accentColor'] ) : '#e50914';
$section_title    = isset( $attributes['sectionTitle'] ) ? sanitize_text_field( $attributes['sectionTitle'] ) : '';

// Check if The Events Calendar is active.
if ( ! post_type_exists( 'tribe_events' ) ) {
	printf(
		'<div %s><div class="telex-events-carousel__notice"><p>%s</p></div></div>',
		get_block_wrapper_attributes( array( 'style' => '--tec-accent:' . esc_attr( $accent_color ) ) ),
		esc_html__( 'The Events Calendar plugin is required to display events.', 'telex-events-carousel' )
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

if ( 'upcoming' === $event_order ) {
	$query_args['meta_key']  = '_EventStartDate';
	$query_args['orderby']   = 'meta_value';
	$query_args['order']     = 'ASC';
	$query_args['meta_query'] = array(
		array(
			'key'     => '_EventStartDate',
			'value'   => $now,
			'compare' => '>=',
			'type'    => 'DATETIME',
		),
	);
} else {
	$query_args['meta_key']  = '_EventStartDate';
	$query_args['orderby']   = 'meta_value';
	$query_args['order']     = 'DESC';
	$query_args['meta_query'] = array(
		array(
			'key'     => '_EventStartDate',
			'value'   => $now,
			'compare' => '<',
			'type'    => 'DATETIME',
		),
	);
}

$events_query = new WP_Query( $query_args );

$wrapper_attributes = get_block_wrapper_attributes( array(
	'style' => '--tec-accent:' . esc_attr( $accent_color ),
) );
?>
<div <?php echo $wrapper_attributes; ?> tabindex="0" aria-label="<?php esc_attr_e( 'Events carousel', 'telex-events-carousel' ); ?>">
	<?php if ( $section_title ) : ?>
		<h2 class="telex-events-carousel__title"><?php echo esc_html( $section_title ); ?></h2>
	<?php endif; ?>

	<?php if ( ! $events_query->have_posts() ) : ?>
		<div class="telex-events-carousel__notice">
			<p><?php esc_html_e( 'No events found.', 'telex-events-carousel' ); ?></p>
		</div>
	<?php else : ?>
		<div class="telex-events-carousel__track-wrapper">
			<button
				class="telex-events-carousel__nav telex-events-carousel__nav--left"
				aria-label="<?php esc_attr_e( 'Scroll left', 'telex-events-carousel' ); ?>"
				type="button"
			>
				<span>&#8249;</span>
			</button>
			<div class="telex-events-carousel__track">
				<?php
				while ( $events_query->have_posts() ) :
					$events_query->the_post();
					$event_id   = get_the_ID();
					$event_link = get_permalink( $event_id );
					$start_date = get_post_meta( $event_id, '_EventStartDate', true );
					$venue_id   = get_post_meta( $event_id, '_EventVenueID', true );
					$venue_name = '';

					if ( $venue_id ) {
						$venue_post = get_post( absint( $venue_id ) );
						if ( $venue_post ) {
							$venue_name = $venue_post->post_title;
						}
					}

					$thumbnail_url = get_the_post_thumbnail_url( $event_id, 'medium_large' );
					if ( ! $thumbnail_url ) {
						$thumbnail_url = get_the_post_thumbnail_url( $event_id, 'medium' );
					}

					$formatted_date = '';
					if ( $start_date ) {
						$timestamp      = strtotime( $start_date );
						$formatted_date = wp_date( 'M j, Y', $timestamp );
					}

					$excerpt = get_the_excerpt( $event_id );
					if ( strlen( $excerpt ) > 100 ) {
						$excerpt = substr( $excerpt, 0, 100 ) . '…';
					}
					?>
					<a href="<?php echo esc_url( $event_link ); ?>" class="telex-events-carousel__card" aria-label="<?php echo esc_attr( get_the_title( $event_id ) ); ?>">
						<div class="telex-events-carousel__card-image">
							<?php if ( $thumbnail_url ) : ?>
								<img
									src="<?php echo esc_url( $thumbnail_url ); ?>"
									alt="<?php echo esc_attr( get_the_title( $event_id ) ); ?>"
									loading="lazy"
									decoding="async"
								/>
							<?php else : ?>
								<div class="telex-events-carousel__card-placeholder">
									<span>📅</span>
								</div>
							<?php endif; ?>
							<div class="telex-events-carousel__card-overlay">
								<?php if ( $show_date && $formatted_date ) : ?>
									<span class="telex-events-carousel__card-date"><?php echo esc_html( $formatted_date ); ?></span>
								<?php endif; ?>
								<h3 class="telex-events-carousel__card-name"><?php echo esc_html( get_the_title( $event_id ) ); ?></h3>
								<?php if ( $show_venue && $venue_name ) : ?>
									<span class="telex-events-carousel__card-venue">📍 <?php echo esc_html( $venue_name ); ?></span>
								<?php endif; ?>
								<?php if ( $show_excerpt && $excerpt ) : ?>
									<p class="telex-events-carousel__card-excerpt"><?php echo esc_html( $excerpt ); ?></p>
								<?php endif; ?>
							</div>
						</div>
					</a>
				<?php endwhile; ?>
			</div>
			<button
				class="telex-events-carousel__nav telex-events-carousel__nav--right"
				aria-label="<?php esc_attr_e( 'Scroll right', 'telex-events-carousel' ); ?>"
				type="button"
			>
				<span>&#8250;</span>
			</button>
		</div>
	<?php endif; ?>
	<?php wp_reset_postdata(); ?>
</div>
