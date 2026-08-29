<script lang="ts">
	import type { PageProps } from './$types';
	import { Calendar, ChevronLeft, Target, Play, BookOpen, Clock, Activity, ArrowRight, Trash2, AlertTriangle, X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data }: PageProps = $props();
	let plan = $derived(data.plan);
	let sessions = $derived(data.sessions);
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);

	const surahNames: Record<number, string> = {
		1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa'", 5: "Al-Ma'idah",
		6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Taubah", 10: "Yunus",
		11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
		16: "An-Nahl", 17: "Al-Isra'", 18: "Al-Kahf", 19: "Maryam", 20: "Taha",
		21: "Al-Anbiya'", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
		26: "Asy-Syu'ara'", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-'Ankabut", 30: "Ar-Rum",
		31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba'", 35: "Fatir",
		36: "Yasin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Gafir",
		41: "Fussilat", 42: "Asy-Syura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jasiyah",
		46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
		51: "Az-Zariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
		56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadalah", 59: "Al-Hasyr", 60: "Al-Mumtahanah",
		61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Tagabun", 65: "At-Talaq",
		66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
		71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddassir", 75: "Al-Qiyamah",
		76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba'", 79: "An-Nazi'at", 80: "'Abasa",
		81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Insyiqaq", 85: "Al-Buruj",
		86: "At-Tariq", 87: "Al-A'la", 88: "Al-Gasyiyah", 89: "Al-Fajr", 90: "Al-Balad",
		91: "Asy-Syams", 92: "Al-Lail", 93: "Ad-Duha", 94: "Asy-Syarh", 95: "At-Tin",
		96: "Al-'Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-'Adiyat",
		101: "Al-Qari'ah", 102: "At-Takasur", 103: "Al-'Asr", 104: "Al-Humazah", 105: "Al-Fil",
		106: "Quraisy", 107: "Al-Ma'un", 108: "Al-Kausar", 109: "Al-Kafirun", 110: "An-Nasr",
		111: "Al-Lahab", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
	};

	const juzStarts = [
		{ juz: 1, surah: 1, ayah: 1 }, { juz: 2, surah: 2, ayah: 142 }, { juz: 3, surah: 2, ayah: 253 },
		{ juz: 4, surah: 3, ayah: 93 }, { juz: 5, surah: 4, ayah: 24 }, { juz: 6, surah: 4, ayah: 148 },
		{ juz: 7, surah: 5, ayah: 82 }, { juz: 8, surah: 6, ayah: 111 }, { juz: 9, surah: 7, ayah: 88 },
		{ juz: 10, surah: 8, ayah: 41 }, { juz: 11, surah: 9, ayah: 93 }, { juz: 12, surah: 11, ayah: 6 },
		{ juz: 13, surah: 12, ayah: 53 }, { juz: 14, surah: 15, ayah: 1 }, { juz: 15, surah: 17, ayah: 1 },
		{ juz: 16, surah: 18, ayah: 75 }, { juz: 17, surah: 21, ayah: 1 }, { juz: 18, surah: 23, ayah: 1 },
		{ juz: 19, surah: 25, ayah: 21 }, { juz: 20, surah: 27, ayah: 56 }, { juz: 21, surah: 29, ayah: 46 },
		{ juz: 22, surah: 33, ayah: 31 }, { juz: 23, surah: 36, ayah: 28 }, { juz: 24, surah: 39, ayah: 32 },
		{ juz: 25, surah: 41, ayah: 47 }, { juz: 26, surah: 46, ayah: 1 }, { juz: 27, surah: 51, ayah: 31 },
		{ juz: 28, surah: 58, ayah: 1 }, { juz: 29, surah: 67, ayah: 1 }, { juz: 30, surah: 78, ayah: 1 }
	];

	function getJuz(surah: number, ayah: number) {
		for (let i = juzStarts.length - 1; i >= 0; i--) {
			const j = juzStarts[i];
			if (surah > j.surah || (surah === j.surah && ayah >= j.ayah)) {
				return j.juz;
			}
		}
		return 1;
	}
</script>

<svelte:head>
	<title>{plan.title} - Program Khatam</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
	
	<!-- Header & Back -->
	<div>
		<a href="/khatam" class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium mb-6 transition-colors">
			<ChevronLeft size={16} />
			Kembali
		</a>
		<div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
			<div>
				<div class="flex items-center gap-3 mb-2">
					<h1 class="text-3xl font-bold tracking-tight">{plan.title}</h1>
					{#if plan.isCompleted}
						<span class="bg-green-500/10 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium">Selesai</span>
					{:else}
						<span class="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">Berjalan</span>
					{/if}
				</div>
				<div class="flex items-center gap-4 text-sm text-muted-foreground">
					<span class="flex items-center gap-1.5"><Calendar size={14} /> Dibuat: {new Date(plan.createdAt).toLocaleDateString('id-ID')}</span>
					<span class="flex items-center gap-1.5"><Target size={14} /> Target: {new Date(plan.targetDate).toLocaleDateString('id-ID')}</span>
				</div>
			</div>
			
			<div class="flex items-center gap-3 shrink-0">
				<button 
					type="button"
					onclick={() => showDeleteConfirm = true}
					class="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-sm font-semibold hover:-translate-y-0.5"
					title="Hapus program khatam ini"
				>
					<Trash2 size={17} />
					<span>Hapus</span>
				</button>

				<a 
					href="/surah/{plan.nextSurahToRead}?page={Math.ceil(plan.nextAyahToRead / 10)}&khatam_plan_id={plan.id}#ayah-{plan.nextAyahToRead}" 
					class="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-foreground/10 hover:shadow-foreground/20 hover:-translate-y-0.5 shrink-0"
				>
					<Play size={18} class="fill-current" />
					<span>{sessions.length > 0 ? 'Lanjutkan Bacaan' : 'Mulai Membaca'}</span>
				</a>
			</div>
		</div>
	</div>

	<!-- Big Progress -->
	<div class="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
		<div class="flex justify-between items-end">
			<div>
				<p class="text-sm font-medium text-muted-foreground mb-1">Progres Khatam</p>
				<div class="text-4xl md:text-5xl font-black text-primary">{plan.progressPercentage.toFixed(1)}<span class="text-2xl md:text-3xl text-muted-foreground">%</span></div>
			</div>
			<div class="text-right">
				<p class="text-sm font-medium text-muted-foreground mb-1">Total Ayat Dibaca</p>
				<div class="text-2xl font-bold">{plan.totalAyahsRead.toLocaleString('id-ID')} / 6.236</div>
			</div>
		</div>
		
		<div class="h-4 md:h-6 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
			<div 
				class="h-full {plan.isCompleted ? 'bg-green-500' : 'bg-primary'} rounded-full transition-all duration-1000 ease-out relative" 
				style="width: {plan.progressPercentage}%"
			>
				<div class="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style="background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);"></div>
			</div>
		</div>
	</div>

	<!-- Sessions History -->
	<div class="space-y-6 pt-4">
		<h2 class="text-xl font-bold flex items-center gap-2">
			<Activity size={20} class="text-primary" />
			Riwayat Sesi Bacaan
		</h2>
		
		{#if sessions.length === 0}
			<div class="text-center p-12 bg-secondary/30 rounded-2xl border border-border border-dashed">
				<p class="text-muted-foreground font-medium">Belum ada riwayat bacaan pada program ini.</p>
				<p class="text-sm text-muted-foreground mt-1">Klik tombol Mulai Membaca di atas untuk merekam progres pertama Anda.</p>
			</div>
		{:else}
			<div class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
				{#each sessions as session}
					{@const startJuz = getJuz(session.startSurah, session.startAyah)}
					{@const endJuz = getJuz(session.endSurah, session.endAyah)}
					{@const startSurahName = surahNames[session.startSurah] ?? `Surah ${session.startSurah}`}
					{@const endSurahName = surahNames[session.endSurah] ?? `Surah ${session.endSurah}`}
					<div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
						<!-- Timeline dot -->
						<div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
							<BookOpen size={16} />
						</div>
						
						<!-- Card -->
						<div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all space-y-3">
							<!-- Top Bar: Date & Total Ayahs Badge -->
							<div class="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
								<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Clock size={13} class="text-primary" />
									<time>{new Date(session.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\bMinggu\b/gi, 'Ahad')}</time>
								</div>
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
									+{session.totalAyahRead} Ayat
								</span>
							</div>

							<!-- Reading Progress Range -->
							<div class="space-y-1.5">
								<div class="inline-block text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
									{#if startJuz === endJuz}
										Juz {startJuz}
									{:else}
										Juz {startJuz} &rarr; Juz {endJuz}
									{/if}
								</div>
								
								<div class="flex items-center gap-2 flex-wrap text-sm sm:text-[15px] font-semibold text-foreground pt-0.5">
									<div class="flex items-baseline gap-1.5">
										<span class="font-bold text-foreground">{startSurahName}</span>
										<span class="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Ayat {session.startAyah}</span>
									</div>
									
									<ArrowRight size={14} class="text-muted-foreground/70 shrink-0" />
									
									<div class="flex items-baseline gap-1.5">
										<span class="font-bold text-foreground">{endSurahName}</span>
										<span class="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Ayat {session.endAyah}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Modal Konfirmasi Hapus Program -->
{#if showDeleteConfirm}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
		onclick={() => showDeleteConfirm = false}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}
	></div>

	<!-- Modal Box -->
	<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card border border-border rounded-3xl p-6 md:p-8 z-50 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-3.5">
				<div class="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
					<AlertTriangle size={24} />
				</div>
				<div>
					<h3 class="text-lg font-bold text-foreground">Hapus Program Khatam?</h3>
					<p class="text-xs text-muted-foreground mt-0.5">Peringatan Penghapusan Permanen</p>
				</div>
			</div>
			<button 
				type="button" 
				onclick={() => showDeleteConfirm = false}
				class="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
			>
				<X size={18} />
			</button>
		</div>

		<div class="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-xs text-destructive leading-relaxed">
			Program <strong>"{plan.title}"</strong> beserta seluruh riwayat bacaan ({sessions.length} sesi) di dalamnya akan dihapus secara permanen dari database.
		</div>

		<p class="text-xs text-muted-foreground leading-relaxed">
			Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin tetap menghapus program ini?
		</p>

		<div class="flex items-center justify-end gap-3 pt-2">
			<button 
				type="button" 
				onclick={() => showDeleteConfirm = false}
				class="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-semibold transition-colors"
			>
				Batal
			</button>

			<form method="POST" action="?/deletePlan" use:enhance={() => {
				isDeleting = true;
				return async ({ update }) => {
					await update();
					isDeleting = false;
				};
			}}>
				<button 
					type="submit" 
					disabled={isDeleting}
					class="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-bold shadow-lg shadow-destructive/20 transition-all flex items-center gap-2 disabled:opacity-70"
				>
					<Trash2 size={16} />
					<span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Program'}</span>
				</button>
			</form>
		</div>
	</div>
{/if}
