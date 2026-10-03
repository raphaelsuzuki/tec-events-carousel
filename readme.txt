=== Events Calendar Carousel ===

Contributors:      WordPress
Tags:              block, events, carousel, the events calendar, netflix
Tested up to:      6.8
Stable tag:        0.1.1
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

A Netflix-inspired carousel block that displays events from The Events Calendar plugin in a sleek, horizontally scrollable row with smooth animations and hover effects.

== Description ==

Events Calendar Carousel brings a cinematic, Netflix-style browsing experience to your WordPress events. It integrates seamlessly with The Events Calendar plugin by Modern Tribe, pulling upcoming (or past) events and presenting them as visually rich cards in a horizontally scrollable carousel.

**Features:**

* Netflix-style horizontal carousel with smooth CSS scroll-snap
* Hover-to-reveal event details with elegant scale and overlay animations
* Left/right navigation arrows for keyboard and mouse users
* Configurable number of events (1–20)
* Choose between upcoming or past events
* Option to show/hide event date, venue, and excerpt
* Fully responsive — adapts from mobile (2 cards) to desktop (5+ cards)
* Dark theme aesthetic with customizable accent color
* Graceful fallback message when The Events Calendar plugin is not active

== Installation ==

1. Make sure The Events Calendar plugin is installed and activated.
2. Upload the plugin files to `/wp-content/plugins/tec-events-carousel` or install via the WordPress plugins screen.
3. Activate the plugin through the 'Plugins' screen in WordPress.
4. Add the "Events Calendar Carousel" block to any post or page via the block editor.

== Frequently Asked Questions ==

= Does this require The Events Calendar plugin? =

Yes. This block fetches events from The Events Calendar (by Modern Tribe / StellarWP). If the plugin is not active, a helpful notice will be displayed instead.

= Can I customize the number of events shown? =

Yes. Use the block's sidebar settings to choose between 1 and 20 events.

= Does it support past events? =

Yes. You can toggle between showing upcoming events or past events in the block settings.

== Screenshots ==

1. The carousel displaying upcoming events in a Netflix-style layout.
2. Hover state showing event details with overlay animation.
3. Block settings panel in the editor.

== Changelog ==

= 0.1.0 =
* Initial release