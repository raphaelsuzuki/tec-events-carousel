<?php
/**
 * Plugin Name:       Events Calendar Carousel
 * Description:       A Netflix-inspired carousel block that displays events from The Events Calendar plugin with smooth animations and hover effects.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            WordPress Telex
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       telex-events-carousel
 *
 * @package TelexEventsCarousel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 */
if ( ! function_exists( 'telex_events_carousel_block_init' ) ) {
	function telex_events_carousel_block_init(): void {
		register_block_type( __DIR__ . '/build/' );
	}
}
add_action( 'init', 'telex_events_carousel_block_init' );