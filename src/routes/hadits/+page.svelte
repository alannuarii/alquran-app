<script lang="ts">
	import type { PageData } from './$types';
	import { 
		Search, Play, Pause, Info, Type, Scroll, 
		Sparkles, Volume2, X, BookOpen, ChevronDown, Check, Loader2, ArrowRight 
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// State
	let activeTab = $state<'arbain' | 'perawi'>('arbain');
	let searchQuery = $state('');
	let selectedCategory = $state('Semua');
	let fontSize = $state(28);
	let activeTafsir = $state<string | null>(null);
	let currentlyPlayingNo = $state<string | null>(null);

	// Quick filter categories for Hadits Arba'in
	const categoryFilters = [
		{ id: 'Semua', label: 'Semua Hadits' },
		{ id: 'Niat & Keimanan', label: 'Niat & Keimanan' },
		{ id: 'Ibadah & Syariat', label: 'Ibadah & Syariat' },
		{ id: 'Akhlak & Muamalah', label: 'Akhlak & Muamalah' },
		{ id: "Halal, Haram & Wara'", label: "Halal & Haram" },
		{ id: 'Zuhud, Hati & Ampunan', label: 'Zuhud & Hati' },
	];

	// Filtered Arba'in Hadits
	let filteredArbain = $derived.by(() => {
		let list = data.arbainList || [];

		// Filter Category
		if (selectedCategory !== 'Semua') {
			list = list.filter((h: any) => h.tema === selectedCategory);
		}

		// Filter Search Query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter((h: any) => 
				(h.judul && h.judul.toLowerCase().includes(q)) ||
				(h.indo && h.indo.toLowerCase().includes(q)) ||
				(h.arab && h.arab.includes(q)) ||
				(h.no && h.no.toString() === q)
			);
		}

		return list;
	});

	// Pagination (10 Hadits per page)
	const ITEMS_PER_PAGE = 10;
	let currentPage = $state(1);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredArbain.length / ITEMS_PER_PAGE)));

	let paginatedArbain = $derived.by(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredArbain.slice(start, start + ITEMS_PER_PAGE);
	});

	// Reset page on filter/search change
	$effect(() => {
		selectedCategory;
		searchQuery;
		currentPage = 1;
	});

	function goToPage(p: number) {
		if (p < 1 || p > totalPages) return;
		currentPage = p;
		if (browser) {
			const toolbarEl = document.getElementById('hadits-toolbar');
			if (toolbarEl) {
				toolbarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}
	}

	// Toggle Tafsir / Riwayat
	function toggleTafsir(id: string) {
		activeTafsir = activeTafsir === id ? null : id;
	}

	// Audio Recitation via Web Speech API (Arabic Native TTS)
	function playAudio(id: string, arabicText: string) {
		if (!browser) return;
		if (!('speechSynthesis' in window)) {
			alert('Browser Anda tidak mendukung pemutaran suara otomatis.');
			return;
		}

		const synth = window.speechSynthesis;

		if (currentlyPlayingNo === id) {
			synth.cancel();
			currentlyPlayingNo = null;
			return;
		}

		synth.cancel();

		const utterance = new SpeechSynthesisUtterance(arabicText);
		utterance.lang = 'ar-SA';
		utterance.rate = 0.82; // Kecepatan pelafalan jernih dan tenang

		const voices = synth.getVoices();
		const arabicVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('SA') || v.lang.includes('EG'));
		if (arabicVoice) {
			utterance.voice = arabicVoice;
		}

		utterance.onstart = () => {
			currentlyPlayingNo = id;
		};

		utterance.onend = () => {
			if (currentlyPlayingNo === id) {
				currentlyPlayingNo = null;
			}
		};

		utterance.onerror = (e) => {
			console.error('TTS audio error:', e);
			currentlyPlayingNo = null;
		};

		currentlyPlayingNo = id;
		synth.speak(utterance);
	}

	function stopAudio() {
		if (browser && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			currentlyPlayingNo = null;
		}
	}

	onDestroy(() => {
		stopAudio();
	});

	// Perawi 9 Kitab Interactive Lookup
	let selectedPerawi = $state('bukhari');
	let perawiHaditsNumber = $state<number>(1);
	let perawiLoading = $state(false);
	let perawiResult = $state<any | null>(null);
	let perawiError = $state<string | null>(null);

	async function searchPerawiHadits() {
		if (!selectedPerawi || !perawiHaditsNumber || perawiHaditsNumber < 1) return;
		perawiLoading = true;
		perawiError = null;
		perawiResult = null;
		stopAudio();

		try {
			const res = await fetch(`https://api.myquran.com/v2/hadits/${selectedPerawi}/${perawiHaditsNumber}`);
			if (!res.ok) throw new Error(`Hadits tidak ditemukan (Status: ${res.status})`);
			const data = await res.json();
			if (data.status && data.data) {
				perawiResult = {
					...data.data,
					perawi: data.info?.perawi
				};
			} else {
				throw new Error(data.message || 'Hadits tidak ditemukan pada nomor ini.');
			}
		} catch (err: any) {
			perawiError = err.message || 'Gagal mengambil data hadits dari server.';
		} finally {
			perawiLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Kumpulan Hadits Shahih & Pilihan - Al-Qur'an Indonesia</title>
	<meta name="description" content="Koleksi lengkap Hadits Arba'in An-Nawawi dan 9 Kitab Perawi Hadits (Kutubut Tis'ah) lengkap dengan teks Arab berharakat, terjemahan Indonesia, audio pelafalan, dan riwayat sanad." />
</svelte:head>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-20">
	<!-- Hero Banner Card -->
	<div class="bg-gradient-to-br from-teal-700 via-primary to-emerald-800 text-primary-foreground rounded-2xl p-6 md:p-8 shadow-lg text-center relative overflow-hidden">
		<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20% 80%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px); background-size: 30px 30px;"></div>
		<div class="relative z-10 space-y-3">
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
				<Scroll size={14} />
				<span>Hadits Nabawi & As-Sunnah</span>
			</div>
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Kumpulan Hadits Shahih & Pilihan</h1>
			<p class="font-uthmani text-2xl md:text-3xl leading-relaxed opacity-95 text-primary-foreground" dir="rtl">
				تَرَكْتُ فِيكُمْ أَمْرَيْنِ لَنْ تَضِلُّوا مَا تَمَسَّكْتُمْ بِهِمَا: كِتَابَ اللَّهِ وَسُنَّةَ نَبِيِّهِ
			</p>
			<p class="text-xs md:text-sm text-primary-foreground/85 max-w-xl mx-auto">
				"Aku tinggalkan kepada kalian dua perkara, kalian tidak akan tersesat selama berpegang teguh kepada keduanya: Kitabullah dan Sunnah Nabi-Nya." (HR. Malik)
			</p>
			<div class="flex items-center justify-center gap-4 text-xs font-semibold border-t border-primary-foreground/20 pt-3 mt-4">
				<span>42 Hadits Arba'in An-Nawawi</span>
				<span>&bull;</span>
				<span>9 Kitab Perawi Utama</span>
				<span>&bull;</span>
				<span>Sanad & Takhrij Lengkap</span>
			</div>
		</div>
	</div>

	<!-- Mode Selector Tabs (Arba'in vs 9 Perawi) -->
	<div class="flex items-center justify-center p-1.5 bg-muted/60 rounded-2xl border border-border/80 max-w-md mx-auto">
		<button
			onclick={() => { activeTab = 'arbain'; stopAudio(); }}
			class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 {activeTab === 'arbain' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<Scroll size={16} />
			<span>Hadits Arba'in (42 Pokok)</span>
		</button>
		<button
			onclick={() => { activeTab = 'perawi'; stopAudio(); }}
			class="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 {activeTab === 'perawi' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			<BookOpen size={16} />
			<span>Cari 9 Kitab Perawi</span>
		</button>
	</div>

	<!-- TAB 1: HADITS ARBA'IN -->
	{#if activeTab === 'arbain'}
		<!-- Search & Category Filters -->
		<div class="space-y-4">
			<!-- Search Bar -->
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
					<Search size={18} />
				</div>
				<input 
					type="text" 
					bind:value={searchQuery}
					placeholder="Cari hadits (contoh: niat, rukun islam, marah, halal haram, dsb.)..." 
					class="block w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm transition-all"
				/>
				{#if searchQuery}
					<button 
						onclick={() => searchQuery = ''}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
						aria-label="Hapus pencarian"
					>
						<X size={16} />
					</button>
				{/if}
			</div>

			<!-- Category Quick Pills -->
			<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-medium no-scrollbar">
				{#each categoryFilters as cat}
					<button
						onclick={() => selectedCategory = cat.id}
						class="px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border {selectedCategory === cat.id ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/80'}"
					>
						{#if cat.id === 'Semua'}
							<Sparkles size={13} />
						{/if}
						<span>{cat.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Sticky Toolbar (Font Slider, Page Counter) -->
		<div id="hadits-toolbar" class="sticky top-0 bg-background/95 backdrop-blur z-20 py-3 border-b border-border flex items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-xs text-muted-foreground font-medium">
				<span class="font-bold text-foreground">{filteredArbain.length}</span> hadits ditemukan
				{#if totalPages > 1}
					<span>&bull; Hal. <strong class="text-primary">{currentPage}</strong>/{totalPages}</span>
				{/if}
				{#if selectedCategory !== 'Semua'}
					<span class="hidden sm:inline">&bull; Tema: <strong class="text-primary">{selectedCategory}</strong></span>
				{/if}
			</div>
			
			<div class="flex items-center gap-3">
				<Type size={16} class="text-muted-foreground shrink-0" />
				<input 
					type="range" 
					min="22" 
					max="50" 
					bind:value={fontSize} 
					class="w-24 sm:w-28 accent-primary cursor-pointer"
					title="Atur Ukuran Teks Arab"
				/>
				<span class="text-xs text-muted-foreground w-8 text-right font-mono">{fontSize}px</span>
			</div>
		</div>

		<!-- Hadits Cards List -->
		<div class="space-y-8">
			{#each paginatedArbain as hadits, idx (hadits.no)}
				<div 
					id="hadits-{hadits.no}"
					class="transition-all duration-300 rounded-2xl p-3 sm:p-4 {currentlyPlayingNo === `arbain-${hadits.no}` ? 'bg-primary/5 border border-primary/40 shadow-md ring-2 ring-primary/20' : 'hover:bg-muted/30'}"
				>
					<!-- Action Bar (Top Header per Hadits) -->
					<div class="flex items-center justify-between mb-4 bg-muted/50 dark:bg-muted/40 rounded-xl px-3 sm:px-4 py-2.5 gap-2">
						<!-- Left: Number badge & Category tag -->
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="flex items-center justify-center w-8 h-8 rounded-full {currentlyPlayingNo === `arbain-${hadits.no}` ? 'bg-primary text-primary-foreground font-black animate-pulse' : 'bg-primary/10 text-primary font-bold'} text-xs shrink-0">
								{hadits.no}
							</div>
							<div class="min-w-0">
								<h2 class="text-sm font-bold text-foreground truncate">{hadits.judul}</h2>
								{#if hadits.tema}
									<span class="text-[11px] text-muted-foreground font-medium truncate block">Tema: {hadits.tema}</span>
								{/if}
							</div>
						</div>

						<!-- Right: Action Buttons -->
						<div class="flex items-center gap-1 shrink-0">
							<!-- Play / Stop Audio Button -->
							<button
								onclick={() => playAudio(`arbain-${hadits.no}`, hadits.arab)}
								class="p-2 rounded-full {currentlyPlayingNo === `arbain-${hadits.no}` ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-primary/10 text-primary'} transition-all"
								title={currentlyPlayingNo === `arbain-${hadits.no}` ? 'Hentikan Audio' : 'Dengarkan Pelafalan Arab'}
								aria-label="Putar Audio Hadits"
							>
								{#if currentlyPlayingNo === `arbain-${hadits.no}`}
									<Pause size={17} />
								{:else}
									<Play size={17} />
								{/if}
							</button>

							<!-- Tafsir / Riwayat Button -->
							<button
								onclick={() => toggleTafsir(`arbain-${hadits.no}`)}
								class="p-2 rounded-full {activeTafsir === `arbain-${hadits.no}` ? 'bg-primary/15 text-primary' : 'hover:bg-muted text-muted-foreground'} transition-colors"
								title="Tafsir & Riwayat Hadits"
								aria-label="Tafsir & Riwayat Hadits"
							>
								<Info size={17} />
							</button>
						</div>
					</div>

					<!-- Playing Wave Banner (if active) -->
					{#if currentlyPlayingNo === `arbain-${hadits.no}`}
						<div transition:slide={{ duration: 150 }} class="flex items-center justify-between bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 mb-3 text-xs font-semibold">
							<div class="flex items-center gap-2">
								<Volume2 size={15} class="animate-bounce" />
								<span>Sedang Memutar Pelafalan Hadits No. {hadits.no}...</span>
							</div>
							<button onclick={stopAudio} class="text-xs hover:underline">Hentikan</button>
						</div>
					{/if}

					<!-- Arabic Text (Styled with font-uthmani, loose line-height, adjustable font size) -->
					<p
						class="font-uthmani text-right leading-loose text-foreground mb-4 px-2"
						style="font-size: {fontSize}px; line-height: {fontSize < 32 ? '2.4' : '2.8'};"
						dir="rtl"
					>
						{hadits.arab}
					</p>

					<!-- Terjemahan / Arti -->
					<p class="text-muted-foreground leading-relaxed text-sm sm:text-base px-2">
						{hadits.indo}
					</p>

					<!-- Tafsir & Riwayat Hadits (Expandable Section) -->
					{#if activeTafsir === `arbain-${hadits.no}`}
						<div transition:slide={{ duration: 200 }} class="bg-muted/50 dark:bg-muted/30 border border-border rounded-xl p-4 mt-4 text-xs sm:text-sm space-y-2">
							<div class="flex items-center gap-2 font-bold text-primary text-xs uppercase tracking-wider">
								<BookOpen size={14} />
								<span>Informasi Riwayat & Takhrij Hadits</span>
							</div>
							<p class="text-foreground leading-relaxed">
								Hadits ini merupakan hadits ke-<strong>{hadits.no}</strong> dari kitab <em>Al-Arba'in An-Nawawiyyah</em> karya Imam Yahya bin Syaraf An-Nawawi (wafat 676 H).
							</p>
							<div class="pt-2 border-t border-border/50 text-muted-foreground text-xs">
								Kitab rujukan dan sanad dapat ditemukan pada akhir redaksi terjemahan di atas.
							</div>
						</div>
					{/if}

					<!-- Divider -->
					<div class="h-px bg-border/40 mt-6"></div>
				</div>
			{:else}
				<div class="py-16 text-center space-y-3 bg-card border border-border/60 rounded-2xl p-6">
					<div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
						<Search size={24} />
					</div>
					<h3 class="text-base font-bold text-foreground">Hadits Tidak Ditemukan</h3>
					<p class="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
						Tidak ada hadits yang cocok dengan kata kunci atau tema yang dipilih. Cobalah kata kunci lain seperti "niat", "rukun islam", atau reset ke "Semua Hadits".
					</p>
					<button 
						onclick={() => { searchQuery = ''; selectedCategory = 'Semua'; }}
						class="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
					>
						Reset Pencarian
					</button>
				</div>
			{/each}
		</div>

		<!-- Pagination Controls (Sesuai model dan desain Al-Qur'an & Doa) -->
		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-3 pt-6 pb-4">
				<!-- Prev Button -->
				{#if currentPage > 1}
					<button 
						onclick={() => goToPage(currentPage - 1)} 
						class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer"
						title="Halaman Sebelumnya"
					>
						&larr; Prev
					</button>
				{:else}
					<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
						&larr; Prev
					</button>
				{/if}
				
				<span class="text-sm font-medium text-muted-foreground px-4">
					Hal. {currentPage} / {totalPages}
				</span>

				<!-- Next Button -->
				{#if currentPage < totalPages}
					<button 
						onclick={() => goToPage(currentPage + 1)} 
						class="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer"
						title="Halaman Selanjutnya"
					>
						Next &rarr;
					</button>
				{:else}
					<button disabled class="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold opacity-50 cursor-not-allowed">
						Next &rarr;
					</button>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- TAB 2: CARI 9 KITAB PERAWI (KUTUBUT TIS'AH) -->
	{#if activeTab === 'perawi'}
		<div class="space-y-6">
			<!-- Perawi Search Form Card -->
			<div class="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
				<div>
					<h2 class="text-lg font-bold text-foreground">Pencarian 9 Kitab Perawi Hadits</h2>
					<p class="text-xs text-muted-foreground mt-0.5">Pilih nama imam perawi dan masukkan nomor hadits yang ingin dicari</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
					<!-- Perawi Dropdown -->
					<div class="sm:col-span-6 space-y-1">
						<label for="perawi-select" class="text-xs font-semibold text-muted-foreground">Pilih Imam / Perawi:</label>
						<select
							id="perawi-select"
							bind:value={selectedPerawi}
							class="w-full bg-background text-foreground border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
						>
							{#each data.perawiList as p}
								<option value={p.slug}>{p.name} ({p.total.toLocaleString('id-ID')} Hadits)</option>
							{/each}
						</select>
					</div>

					<!-- Hadits Number Input -->
					<div class="sm:col-span-4 space-y-1">
						<label for="perawi-num" class="text-xs font-semibold text-muted-foreground">Nomor Hadits:</label>
						<input
							id="perawi-num"
							type="number"
							min="1"
							bind:value={perawiHaditsNumber}
							class="w-full bg-background text-foreground border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							placeholder="Contoh: 1"
						/>
					</div>

					<!-- Search Action Button -->
					<div class="sm:col-span-2 flex items-end">
						<button
							onclick={searchPerawiHadits}
							disabled={perawiLoading}
							class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer"
						>
							{#if perawiLoading}
								<Loader2 size={16} class="animate-spin" />
							{:else}
								<Search size={16} />
								<span>Cari</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- Quick Recommendation Chips for Bukhari / Muslim -->
				<div class="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
					<span class="font-medium">Contoh Populer:</span>
					<button 
						onclick={() => { selectedPerawi = 'bukhari'; perawiHaditsNumber = 1; searchPerawiHadits(); }} 
						class="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
					>
						Bukhari No. 1 (Niat)
					</button>
					<button 
						onclick={() => { selectedPerawi = 'muslim'; perawiHaditsNumber = 1; searchPerawiHadits(); }} 
						class="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
					>
						Muslim No. 1 (Kejujuran)
					</button>
					<button 
						onclick={() => { selectedPerawi = 'tirmidzi'; perawiHaditsNumber = 1; searchPerawiHadits(); }} 
						class="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
					>
						Tirmidzi No. 1 (Thaharah)
					</button>
				</div>
			</div>

			<!-- Perawi Search Result Display (Ayat-style Card) -->
			{#if perawiLoading}
				<div class="py-16 text-center space-y-3 bg-card border border-border/60 rounded-2xl p-6">
					<Loader2 size={32} class="animate-spin mx-auto text-primary" />
					<p class="text-sm font-semibold text-foreground">Mengambil data hadits dari server...</p>
				</div>
			{:else if perawiError}
				<div class="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-center space-y-2">
					<p class="font-bold text-sm">Gagal Menampilkan Hadits</p>
					<p class="text-xs">{perawiError}</p>
				</div>
			{:else if perawiResult}
				<div class="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
					<!-- Top Action Bar -->
					<div class="flex items-center justify-between bg-muted/50 dark:bg-muted/40 rounded-xl px-4 py-3 gap-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-xs shrink-0">
								{perawiResult.number}
							</div>
							<div class="min-w-0">
								<h2 class="text-sm font-bold text-foreground truncate">
									Hadits {perawiResult.perawi?.name || selectedPerawi} No. {perawiResult.number}
								</h2>
								<span class="text-[11px] text-muted-foreground font-medium">Kitab Shahih / Sunan</span>
							</div>
						</div>

						<div class="flex items-center gap-1 shrink-0">
							<!-- Play / Stop Audio Button -->
							<button
								onclick={() => playAudio(`perawi-${perawiResult.number}`, perawiResult.arab)}
								class="p-2 rounded-full {currentlyPlayingNo === `perawi-${perawiResult.number}` ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-primary/10 text-primary'} transition-all"
								title={currentlyPlayingNo === `perawi-${perawiResult.number}` ? 'Hentikan Audio' : 'Dengarkan Pelafalan Arab'}
								aria-label="Putar Audio Hadits"
							>
								{#if currentlyPlayingNo === `perawi-${perawiResult.number}`}
									<Pause size={17} />
								{:else}
									<Play size={17} />
								{/if}
							</button>
						</div>
					</div>

					<!-- Playing Wave Banner -->
					{#if currentlyPlayingNo === `perawi-${perawiResult.number}`}
						<div transition:slide={{ duration: 150 }} class="flex items-center justify-between bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-xs font-semibold">
							<div class="flex items-center gap-2">
								<Volume2 size={15} class="animate-bounce" />
								<span>Sedang Memutar Pelafalan Hadits {perawiResult.perawi?.name || selectedPerawi} No. {perawiResult.number}...</span>
							</div>
							<button onclick={stopAudio} class="text-xs hover:underline">Hentikan</button>
						</div>
					{/if}

					<!-- Arabic Text -->
					<p
						class="font-uthmani text-right leading-loose text-foreground px-2"
						style="font-size: {fontSize}px; line-height: 2.6;"
						dir="rtl"
					>
						{perawiResult.arab}
					</p>

					<!-- Indonesian Translation -->
					<div class="pt-4 border-t border-border/50 px-2 space-y-1">
						<span class="text-xs font-bold text-primary uppercase tracking-wider block">Terjemahan:</span>
						<p class="text-muted-foreground leading-relaxed text-sm sm:text-base">
							{perawiResult.id}
						</p>
					</div>
				</div>
			{:else}
				<div class="py-12 text-center space-y-2 bg-muted/20 border border-border/40 rounded-2xl p-6 text-muted-foreground">
					<Scroll size={32} class="mx-auto text-muted-foreground/60" />
					<p class="text-sm font-semibold">Pilih kitab perawi dan tekan tombol Cari untuk membaca hadits.</p>
					<p class="text-xs text-muted-foreground">Tersedia lebih dari 30.000 hadits dari 9 Imam hadits terkemuka.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
