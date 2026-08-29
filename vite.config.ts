import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			serviceWorker: {
				register: false
			},
			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: '/'
			},
			manifest: {
				name: 'Aplikasi Al-Qur\'an',
				short_name: 'Al-Quran',
				description: 'Aplikasi Al-Qur\'an web dan PWA modern',
				theme_color: '#16a34a',
				background_color: '#ffffff',
				icons: [
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}']
			}
		})
	],
	server: {
		port: 3000,
		strictPort: true
	}
});
