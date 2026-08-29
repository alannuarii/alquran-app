<script lang="ts">
	import type { PageData } from './$types';
	import { Search } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let searchQuery = $state('');
	
	let filteredSurahs = $derived(data.surahs.filter((s: any) => 
		s.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) || 
		s.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
		s.number.toString() === searchQuery
	));

	// Arab name mapping for common surahs (from Unicode)
	const arabNames: Record<number, string> = {
		1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
		6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
		11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
		16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
		21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
		26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
		31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبإ', 35: 'فاطر',
		36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
		41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
		46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
		51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
		56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
		61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
		66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
		71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
		76: 'الإنسان', 77: 'المرسلات', 78: 'النبإ', 79: 'النازعات', 80: 'عبس',
		81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
		86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
		91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
		96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
		101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
		106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
		111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
	};
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
	<div class="sticky top-0 bg-background/95 backdrop-blur z-10 py-4 space-y-4">
		<h1 class="text-3xl font-bold text-foreground">Daftar Surah</h1>
		
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<Search class="h-5 w-5 text-muted-foreground" />
			</div>
			<input 
				type="text" 
				bind:value={searchQuery}
				placeholder="Cari surah (contoh: Al-Baqarah, 2, atau Sapi Betina)" 
				class="block w-full pl-10 pr-3 py-3 border border-border rounded-xl leading-5 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-colors"
			>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
		{#each filteredSurahs as surah (surah.number)}
			<a href="/surah/{surah.number}" class="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group">
				<!-- Nomor Surah -->
				<div class="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors text-sm font-bold">
					{surah.number}
				</div>
				<!-- Nama -->
				<div class="flex-1 min-w-0">
					<div class="flex justify-between items-start gap-2">
						<div class="min-w-0">
							<h3 class="text-base font-bold text-foreground">{surah.name_latin}</h3>
							<p class="text-xs text-muted-foreground">{surah.translation}</p>
						</div>
						<span class="font-uthmani text-xl text-primary flex-shrink-0" dir="rtl">{arabNames[surah.number] ?? ''}</span>
					</div>
					<div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
						<span>{surah.revelation === 'Makkiyah' ? 'Makkah' : 'Madinah'}</span>
						<span>&bull;</span>
						<span>{surah.number_of_ayahs} Ayat</span>
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full py-12 text-center text-muted-foreground">
				Surah tidak ditemukan
			</div>
		{/each}
	</div>
</div>
