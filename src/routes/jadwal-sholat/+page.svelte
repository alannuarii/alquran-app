<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { MapPin, Search, Calendar, AlertCircle, RefreshCw, ChevronDown, Check } from 'lucide-svelte';
	import { getPrayerStatus, sortPrayersBySchedule, type PrayerStatusResult } from '$lib/prayer';
	
	// State variables
	let isLoading = $state(true);
	let locationError = $state('');
	let searchError = $state('');
	let currentTime = $state(new Date());
	
	let cityInfo = $state<{ id: string; name: string; region: string } | null>(null);
	let scheduleData = $state<any>(null);
	
	let showCityModal = $state(false);
	let searchKeyword = $state('');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);
	let searchInputEl: HTMLInputElement | undefined = $state();
	
	const popularCities = [
		{ id: '1301', lokasi: 'KOTA JAKARTA' },
		{ id: '1638', lokasi: 'KOTA SURABAYA' },
		{ id: '1219', lokasi: 'KOTA BANDUNG' },
		{ id: '0228', lokasi: 'KOTA MEDAN' },
		{ id: '2318', lokasi: 'KOTA MAKASSAR' },
		{ id: '1418', lokasi: 'KOTA SEMARANG' },
		{ id: '1505', lokasi: 'KOTA YOGYAKARTA' },
		{ id: '2214', lokasi: 'KOTA MANADO' }
	];
	
	let timeInterval: ReturnType<typeof setInterval>;

	// Get current Date strings for API
	const getTodayParts = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return { year, month, day };
	};

	onMount(() => {
		initLocation();
		
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
	});

	function initLocation() {
		isLoading = true;
		locationError = '';
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					reverseGeocode(position.coords.latitude, position.coords.longitude);
				},
				(error) => {
					console.warn('Geolocation error:', error);
					locationError = 'Izin lokasi ditolak atau tidak tersedia. Menggunakan Jakarta sebagai default.';
					loadDefaultCity();
				},
				{ timeout: 10000 }
			);
		} else {
			locationError = 'Geolokasi tidak didukung di browser ini. Menggunakan Jakarta sebagai default.';
			loadDefaultCity();
		}
	}

	async function reverseGeocode(lat: number, lon: number) {
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
			const data = await res.json();
			
			const candidates = [
				data.address.county,
				data.address.city,
				data.address.municipality,
				data.address.town,
				data.address.state
			];
			
			let cityName = '';
			for (const name of candidates) {
				if (name && typeof name === 'string') {
					const lower = name.toLowerCase();
					if (!lower.includes('kelurahan') && !lower.includes('desa') && !lower.includes('kecamatan')) {
						cityName = name;
						break;
					}
				}
			}
			
			if (!cityName) throw new Error('Kota tidak ditemukan');
			
			cityName = cityName.replace(/kota|kabupaten|selatan|utara|timur|barat|pusat/gi, '').trim();
			await searchCity(cityName, true);
		} catch (error) {
			console.error('Reverse geocode error:', error);
			locationError = 'Gagal melacak nama kota. Menggunakan Jakarta sebagai default.';
			loadDefaultCity();
		}
	}

	async function loadDefaultCity() {
		try {
			await loadSchedule('1301', 'KOTA JAKARTA', 'DKI JAKARTA');
		} catch (error) {
			isLoading = false;
		}
	}

	async function searchCity(keyword: string, autoLoadFirst = false) {
		if (!keyword.trim()) return;
		
		isSearching = true;
		searchError = '';
		try {
			const res = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`);
			const resData = await res.json();
			
			if (resData.status && resData.data && resData.data.length > 0) {
				searchResults = resData.data;
				if (autoLoadFirst) {
					await loadSchedule(searchResults[0].id, searchResults[0].lokasi, '');
				}
			} else {
				if (autoLoadFirst) {
					locationError = `Kota '${keyword}' tidak ditemukan di database. Menggunakan Jakarta.`;
					await loadDefaultCity();
				} else {
					searchError = 'Kota tidak ditemukan.';
					searchResults = [];
				}
			}
		} catch (error) {
			console.error('Search city error:', error);
			if (autoLoadFirst) await loadDefaultCity();
			else searchError = 'Gagal mencari kota.';
		} finally {
			isSearching = false;
		}
	}

	async function loadSchedule(id: string, name: string, region: string) {
		isLoading = true;
		showCityModal = false;
		try {
			const { year, month, day } = getTodayParts();
			const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${id}/${year}/${month}/${day}`);
			const data = await res.json();
			
			if (data.status && data.data) {
				cityInfo = { id: data.data.id, name: data.data.lokasi, region: data.data.daerah };
				scheduleData = data.data.jadwal;
			}
		} catch (error) {
			console.error('Load schedule error:', error);
		} finally {
			isLoading = false;
		}
	}
	
	const formatDate = (date: Date) => {
		const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return date.toLocaleDateString('id-ID', options).replace(/\bMinggu\b/gi, 'Ahad');
	};
	
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
	};

	const prayerStatus = $derived<PrayerStatusResult | null>(
		getPrayerStatus(scheduleData, currentTime)
	);

	const sortedPrayers = $derived(
		sortPrayersBySchedule(scheduleData, currentTime, prayerStatus?.targetPrayerKey)
	);

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchKeyword = target.value;
		if (searchKeyword.trim().length > 1) {
			searchCity(searchKeyword, false);
		} else {
			searchResults = [];
		}
	}

	function openCityModal() {
		searchKeyword = '';
		searchResults = [];
		searchError = '';
		showCityModal = true;
		setTimeout(() => {
			searchInputEl?.focus();
		}, 100);
	}
</script>

<svelte:head>
	<title>Jadwal Sholat | Al-Qur'an App</title>
	<meta name="description" content="Jadwal Sholat hari ini berdasarkan lokasi otomatis" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
	
	<header class="mb-4">
		<h1 class="text-3xl font-extrabold text-foreground tracking-tight">Jadwal Sholat</h1>
		<p class="text-muted-foreground mt-1 text-sm md:text-base">Waktu sholat akurat untuk wilayah Anda</p>
	</header>

	{#if locationError}
		<div class="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-4 rounded-2xl flex items-start gap-3 border border-amber-200 dark:border-amber-800">
			<AlertCircle class="shrink-0 mt-0.5" size={18} />
			<div class="text-sm">
				<p class="font-medium">{locationError}</p>
				<button onclick={openCityModal} class="mt-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-100">Ganti Kota Secara Manual</button>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20 space-y-4">
			<RefreshCw class="animate-spin text-primary w-10 h-10" />
			<p class="text-muted-foreground font-medium animate-pulse">Menyiapkan jadwal sholat...</p>
		</div>
	{:else}
		<!-- Main Hero Card -->
		<section class="bg-gradient-to-br from-primary/95 to-primary text-primary-foreground rounded-3xl p-6 md:p-8 shadow-lg shadow-primary/20 relative overflow-hidden flex flex-col justify-between">
			<!-- Decorative Background -->
			<div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
				<svg width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
			</div>
			
			<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
				<!-- Left side: City & Time -->
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<button 
							onclick={openCityModal}
							class="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-all text-white font-bold px-4 py-1.5 rounded-full text-sm backdrop-blur-md group"
						>
							<MapPin size={15} />
							<span>{cityInfo?.name || 'Pilih Kota'}</span>
							<ChevronDown size={14} class="opacity-70 group-hover:opacity-100" />
						</button>
					</div>
					
					<div>
						<div class="text-3xl md:text-6xl font-black tabular-nums tracking-tight">
							{formatTime(currentTime)}
						</div>
						<div class="text-primary-foreground/80 mt-2 font-medium flex items-center gap-2 text-sm md:text-base">
							<Calendar size={15} />
							<span>{formatDate(currentTime)}</span>
							{#if scheduleData}
								<span class="hidden md:inline">&bull; {scheduleData.tanggal?.replace(/\bMinggu\b/gi, 'Ahad')}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right side: Dynamic Prayer Status Info -->
				{#if prayerStatus}
					<div class="bg-white/15 backdrop-blur-md border border-white/25 p-4 md:p-6 rounded-3xl min-w-[240px] md:min-w-[260px] shadow-inner text-center space-y-1.5 md:space-y-2">
						<p class="text-primary-foreground/90 text-[10px] md:text-sm font-bold uppercase tracking-wider">
							{#if prayerStatus.state === 'entered'}
								WAKTU SHOLAT MASUK
							{:else if prayerStatus.state === 'passed_recently'}
								TELAH MASUK
							{:else if prayerStatus.state === 'approaching'}
								SEGERA
							{:else}
								MENJELANG
							{/if}
						</p>

						{#if prayerStatus.state === 'entered'}
							<div class="py-1 space-y-1">
								<div class="text-xl md:text-3xl font-black text-white leading-tight animate-bounce">
									Waktu {prayerStatus.prayer.name} Masuk!
								</div>
								<p class="text-[10px] md:text-xs text-white/90 font-medium">Saatnya menunaikan ibadah sholat</p>
							</div>
						{:else if prayerStatus.state === 'passed_recently'}
							<div class="py-1 space-y-1">
								<div class="text-base md:text-xl font-black text-amber-200 leading-tight">
									{prayerStatus.headline}
								</div>
								<p class="text-[10px] md:text-xs text-white/80 font-medium">Waktu sholat {prayerStatus.prayer.name}</p>
							</div>
						{:else}
							<div class="text-2xl sm:text-3xl md:text-5xl font-black font-mono tabular-nums tracking-tighter drop-shadow-sm">
								{prayerStatus.diffStr}
							</div>
							<div class="text-xs md:text-sm font-bold text-white">
								{prayerStatus.headline}
							</div>
						{/if}

						<div class="mt-2 inline-flex bg-black/25 px-3.5 py-1 rounded-full text-xs font-extrabold text-white">
							{prayerStatus.prayer.name} &bull; Pukul {prayerStatus.prayer.time}
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- Modal Cari Kota -->
		{#if showCityModal}
			<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
				<div class="bg-card text-card-foreground rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border space-y-5 animate-in zoom-in-95 duration-200">
					<div class="flex items-center justify-between border-b border-border/60 pb-3">
						<div class="flex items-center gap-2">
							<MapPin class="text-primary" size={20} />
							<h3 class="text-lg font-bold text-foreground">Pilih / Cari Kota</h3>
						</div>
						<button 
							onclick={() => showCityModal = false}
							class="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
							aria-label="Tutup modal"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
						</button>
					</div>

					<!-- Search input -->
					<div class="relative">
						<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<input 
							bind:this={searchInputEl}
							type="text" 
							placeholder="Ketik nama kota / kabupaten..." 
							bind:value={searchKeyword}
							oninput={handleSearchInput}
							class="w-full bg-muted/60 border border-border rounded-2xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					<!-- Auto Geolocation Button -->
					<button 
						onclick={() => { showCityModal = false; initLocation(); }}
						class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
					>
						<MapPin size={14} />
						<span>Gunakan Lokasi GPS Saya Saat Ini</span>
					</button>

					<!-- Search Results or Popular Cities -->
					<div class="space-y-2">
						{#if isSearching}
							<div class="py-6 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
								<RefreshCw size={14} class="animate-spin text-primary" />
								<span>Mencari daftar kota...</span>
							</div>
						{:else if searchError}
							<div class="py-4 text-xs text-destructive text-center font-medium">{searchError}</div>
						{:else if searchResults.length > 0}
							<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Hasil Pencarian ({searchResults.length})</div>
							<ul class="max-h-56 overflow-y-auto space-y-1 rounded-2xl border border-border p-1">
								{#each searchResults as city}
									<li>
										<button 
											onclick={() => loadSchedule(city.id, city.lokasi, '')}
											class="w-full text-left px-3.5 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors flex justify-between items-center"
										>
											<span class="font-medium truncate">{city.lokasi}</span>
											{#if cityInfo?.id === city.id}
												<Check size={16} class="text-primary shrink-0" />
											{/if}
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Kota Populer</div>
							<div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
								{#each popularCities as city}
									<button 
										onclick={() => loadSchedule(city.id, city.lokasi, '')}
										class="text-left px-3 py-2 text-xs rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground font-medium transition-all flex items-center justify-between {cityInfo?.id === city.id ? 'bg-primary/10 border-primary text-primary font-bold' : ''}"
									>
										<span class="truncate">{city.lokasi.replace('KOTA ', '')}</span>
										{#if cityInfo?.id === city.id}
											<Check size={12} class="text-primary shrink-0" />
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Prayer Times List -->
		{#if scheduleData}
			<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
				{#each sortedPrayers as prayer (prayer.key)}
					{#if scheduleData[prayer.key]}
						{@const isTarget = prayerStatus?.targetPrayerKey === prayer.key}
						{@const isEntered = isTarget && prayerStatus?.state === 'entered'}
						{@const isPassedRecently = isTarget && prayerStatus?.state === 'passed_recently'}
						{@const isApproaching = isTarget && prayerStatus?.state === 'approaching'}
						
						<div class="relative bg-card border rounded-2xl p-5 flex items-center justify-between transition-all duration-700
							{isEntered ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg bg-emerald-500/5 transform scale-[1.02]' : ''}
							{isPassedRecently ? 'border-amber-500/60 ring-2 ring-amber-500/20 shadow-md bg-amber-500/5' : ''}
							{isApproaching ? 'border-primary ring-2 ring-primary/30 shadow-lg transform scale-[1.02]' : ''}
							{!isTarget ? 'border-border opacity-70 hover:opacity-100 hover:border-primary/40' : ''}
						">
							<div class="flex flex-col gap-1">
								<h3 class="font-extrabold text-foreground text-xl tracking-tight">{prayer.name}</h3>
								{#if isEntered}
									<span class="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit animate-pulse">Waktu Masuk</span>
								{:else if isPassedRecently}
									<span class="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">Lewat {prayerStatus?.passedMins} Menit</span>
								{:else if isApproaching}
									<span class="bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit animate-pulse">{prayerStatus?.diffStr} Lagi</span>
								{:else if isTarget}
									<span class="bg-primary text-primary-foreground text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit">Selanjutnya</span>
								{/if}
							</div>
							<p class="text-3xl font-black text-primary font-mono tabular-nums tracking-tighter">
								{scheduleData[prayer.key]}
							</p>
						</div>
					{/if}
				{/each}
			</section>
		{/if}
	{/if}
</div>
