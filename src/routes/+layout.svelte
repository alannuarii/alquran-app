<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { 
		Home, BookOpen, Compass, Target, User, Moon, Sun, Leaf, 
		CalendarDays, Clock, LayoutGrid, X, ChevronRight 
	} from 'lucide-svelte';
	import { page, navigating } from '$app/stores';
	
	import type { Snippet } from 'svelte';
	let { data, children }: { data: LayoutData, children: Snippet } = $props();
	
	let theme = $state('light');
	let isMoreMenuOpen = $state(false);
	
	function toggleTheme() {
		if (theme === 'light') theme = 'dark';
		else if (theme === 'dark') theme = 'sepia';
		else theme = 'light';
		
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('light', 'dark', 'sepia');
			document.documentElement.classList.add(theme);
		}
	}

	const themeIcon = $derived(theme === 'dark' ? Moon : theme === 'sepia' ? Leaf : Sun);
	const themeLabel = $derived(theme === 'dark' ? 'Mode Gelap' : theme === 'sepia' ? 'Mode Sepia' : 'Mode Terang');

	const desktopNavItems = [
		{ href: '/', icon: Home, label: 'Beranda' },
		{ href: '/surah', icon: BookOpen, label: 'Bacaan' },
		{ href: '/khatam', icon: Target, label: 'Khatam' },
		{ href: '/jadwal-sholat', icon: Clock, label: 'Jadwal Sholat' },
		{ href: '/qibla', icon: Compass, label: 'Kiblat' },
		{ href: '/kalender', icon: CalendarDays, label: 'Kalender' },
	];

	const mobileMainItems = [
		{ href: '/', icon: Home, label: 'Beranda' },
		{ href: '/surah', icon: BookOpen, label: 'Bacaan' },
		{ href: '/khatam', icon: Target, label: 'Khatam' },
	];

	const moreMenuItems = [
		{ href: '/jadwal-sholat', icon: Clock, label: 'Jadwal Sholat', desc: 'Waktu sholat akurat seluruh kota' },
		{ href: '/qibla', icon: Compass, label: 'Arah Kiblat', desc: 'Kompas penunjuk arah Ka\'bah' },
		{ href: '/kalender', icon: CalendarDays, label: 'Kalender Hijriah', desc: 'Penanggalan Hijriah & Masehi' },
	];

	const isMoreItemActive = $derived(
		moreMenuItems.some(item => $page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/'))
	);
</script>

<!-- Global Navigation Loading Indicator -->
{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent overflow-hidden pointer-events-none">
		<div class="h-full bg-gradient-to-r from-emerald-400 via-primary to-teal-300 animate-loading-bar shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
	</div>

	<!-- Floating Indicator Badge -->
	<div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-card/95 backdrop-blur-md border border-border/80 text-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
		<svg class="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<span>Memuat data...</span>
	</div>
{/if}

{#if $page.url.pathname === '/login'}
	<main class="w-full h-screen bg-background">
		{@render children()}
	</main>
{:else}
<div class="flex h-screen bg-background text-foreground flex-col md:flex-row">
	
	<!-- Desktop Sidebar -->
	<aside class="hidden md:flex flex-col w-60 border-r border-border bg-card p-4 shrink-0">
		<div class="flex items-center gap-3 mb-8 px-2">
			<BookOpen class="text-primary w-7 h-7 shrink-0" />
			<span class="text-lg font-bold text-primary">Al-Qur'an</span>
		</div>
		
		<nav class="flex-1 space-y-1">
			{#each desktopNavItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-foreground transition-colors {$page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/') ? 'bg-primary/10 text-primary font-medium' : ''}"
				>
					<item.icon size={19} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		
		<div class="mt-auto pt-4 border-t border-border space-y-3">
			<button onclick={toggleTheme} class="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-muted transition-colors text-foreground text-sm">
				{#if theme === 'dark'}<Moon size={19} />{:else if theme === 'sepia'}<Leaf size={19} />{:else}<Sun size={19} />{/if}
				<span>{themeLabel}</span>
			</button>
			
			{#if data.user}
				<div class="flex items-center gap-3 px-3 py-2">
					{#if data.user.picture}
						<img src={data.user.picture} alt={data.user.name} class="w-8 h-8 rounded-full shrink-0" referrerpolicy="no-referrer" />
					{:else}
						<div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
							<User size={16} class="text-primary" />
						</div>
					{/if}
					<div class="text-sm min-w-0">
						<div class="font-medium truncate">{data.user.name}</div>
						<a href="/logout" class="text-xs text-muted-foreground hover:text-primary">Keluar</a>
					</div>
				</div>
			{:else}
				<a href="/auth/google" class="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
					<svg class="w-4 h-4" viewBox="0 0 24 24">
						<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span>Masuk dengan Google</span>
				</a>
			{/if}
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1 overflow-y-auto pb-16 md:pb-0">
		{@render children()}
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40" style="padding-bottom: env(safe-area-inset-bottom);">
		<ul class="flex justify-around items-center h-16 px-2">
			{#each mobileMainItems as item}
				<li class="flex-1">
					<a
						href={item.href}
						class="flex flex-col items-center justify-center gap-1 py-1 w-full {$page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/') ? 'text-primary font-bold' : 'text-muted-foreground'} hover:text-primary transition-colors"
					>
						<item.icon size={21} />
						<span class="text-[11px]">{item.label}</span>
					</a>
				</li>
			{/each}
			<li class="flex-1">
				<button 
					onclick={() => isMoreMenuOpen = !isMoreMenuOpen} 
					class="flex flex-col items-center justify-center gap-1 py-1 w-full {isMoreItemActive || isMoreMenuOpen ? 'text-primary font-bold' : 'text-muted-foreground'} hover:text-primary transition-colors"
					aria-label="Menu lainnya"
				>
					<LayoutGrid size={21} />
					<span class="text-[11px]">Lainnya</span>
				</button>
			</li>
		</ul>
	</nav>

	<!-- Mobile "More Menu" Bottom Sheet Modal -->
	{#if isMoreMenuOpen}
		<!-- Backdrop -->
		<div 
			class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
			onclick={() => isMoreMenuOpen = false}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && (isMoreMenuOpen = false)}
		></div>

		<!-- Sheet Content -->
		<div class="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-card border-t border-border rounded-t-[2.5rem] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300 space-y-6" style="padding-bottom: max(2rem, env(safe-area-inset-bottom));">
			<!-- Pull handle & Header -->
			<div>
				<div class="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4"></div>
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold text-foreground">Menu Lainnya</h2>
						<p class="text-xs text-muted-foreground mt-0.5">Fitur pelengkap Al-Qur'an App</p>
					</div>
					<button 
						onclick={() => isMoreMenuOpen = false}
						class="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Tutup menu"
					>
						<X size={18} />
					</button>
				</div>
			</div>

			<!-- More Features List -->
			<div class="space-y-2.5">
				{#each moreMenuItems as item}
					<a
						href={item.href}
						onclick={() => isMoreMenuOpen = false}
						class="flex items-center justify-between p-3.5 rounded-2xl border transition-all {$page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/') ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-background hover:bg-muted/40 border-border/70 text-foreground'}"
					>
						<div class="flex items-center gap-3.5">
							<div class="w-11 h-11 rounded-xl {$page.url.pathname === item.href ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0">
								<item.icon size={22} />
							</div>
							<div>
								<div class="font-bold text-sm">{item.label}</div>
								<div class="text-xs text-muted-foreground">{item.desc}</div>
							</div>
						</div>
						<ChevronRight size={18} class="text-muted-foreground" />
					</a>
				{/each}
			</div>

			<!-- Theme Toggle & Account Section inside More Sheet -->
			<div class="pt-2 border-t border-border space-y-3">
				<!-- Theme Toggle -->
				<button 
					onclick={toggleTheme} 
					class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-background border border-border/70 text-foreground hover:bg-muted/40 transition-colors"
				>
					<div class="flex items-center gap-3.5">
						<div class="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0">
							{#if theme === 'dark'}<Moon size={22} />{:else if theme === 'sepia'}<Leaf size={22} />{:else}<Sun size={22} />{/if}
						</div>
						<div class="text-left">
							<div class="font-bold text-sm">Mode Tampilan</div>
							<div class="text-xs text-muted-foreground">{themeLabel}</div>
						</div>
					</div>
					<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Ubah</span>
				</button>

				<!-- User Auth / Account -->
				{#if data.user}
					<div class="flex items-center justify-between p-3.5 rounded-2xl bg-background border border-border/70">
						<div class="flex items-center gap-3 min-w-0">
							{#if data.user.picture}
								<img src={data.user.picture} alt={data.user.name} class="w-10 h-10 rounded-full shrink-0" referrerpolicy="no-referrer" />
							{:else}
								<div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
									<User size={18} class="text-primary" />
								</div>
							{/if}
							<div class="min-w-0">
								<div class="font-bold text-sm truncate">{data.user.name}</div>
								<div class="text-xs text-muted-foreground truncate">{data.user.email || 'Pengguna'}</div>
							</div>
						</div>
						<a href="/logout" class="text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
							Keluar
						</a>
					</div>
				{:else}
					<a 
						href="/auth/google" 
						class="flex items-center justify-center gap-2.5 p-3.5 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold text-sm shadow-sm"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24">
							<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span>Masuk dengan Google</span>
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
{/if}
