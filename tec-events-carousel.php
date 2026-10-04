<?php
/**
 * Plugin Name:       Events Calendar Carousel
 * Description:       A Netflix-inspired carousel block that displays events from The Events Calendar plugin with smooth animations and hover effects.
 * Version:           0.1.1
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Raphael Suzuki
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       tec-events-carousel
 *
 * @package EventsCarousel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Makes the taxonomies used by the block available to the editor REST API.
 */
if ( ! function_exists( 'events_carousel_enable_taxonomy_rest' ) ) {
	function events_carousel_enable_taxonomy_rest( array $args, string $taxonomy ): array {
		if ( in_array( $taxonomy, array( 'tribe_events_cat', 'post_tag' ), true ) ) {
			$args['show_in_rest'] = true;
		}

		return $args;
	}
}
add_filter( 'register_taxonomy_args', 'events_carousel_enable_taxonomy_rest', 10, 2 );

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 */
if ( ! function_exists( 'events_carousel_block_init' ) ) {
	function events_carousel_block_init(): void {
		register_block_type( __DIR__ . '/build/' );
	}
}
add_action( 'init', 'events_carousel_block_init' );