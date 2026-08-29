<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronLeft, ChevronRight, CalendarDays, Info } from 'lucide-svelte';
  import { generateCalendarDays, fetchHijriOffset, type CalendarDay } from '$lib/calendar';

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'];

  let currentDate = $state(new Date());
  let currentYear = $derived(currentDate.getFullYear());
  let currentMonth = $derived(currentDate.getMonth());
  let monthName = $derived(currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
  
  let hijriOffset = $state(0);
  let days = $derived(generateCalendarDays(currentYear, currentMonth, hijriOffset));
  
  let isLoadingOffset = $state(true);

  onMount(async () => {
    // Only fetch once on mount to get offset
    hijriOffset = await fetchHijriOffset();
    isLoadingOffset = false;
  });

  function prevMonth() {
    currentDate = new Date(currentYear, currentMonth - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(currentYear, currentMonth + 1, 1);
  }

  function extractHijriShort(hijriStr: string) {
      if (!hijriStr) return '';
      const parts = hijriStr.split(' ');
      let month = parts[1];
      if (parts.length > 3 && isNaN(parseInt(parts[2]))) {
          month = parts[1] + ' ' + parts[2];
      }
      
      const abbreviations: Record<string, string> = {
          'Muharam': 'Muh',
          'Safar': 'Saf',
          'Rabiulawal': 'Rab.A',
          'Rabiul Awal': 'Rab.A',
          'Rabiulakhir': 'Rab.Ak',
          'Rabiul Akhir': 'Rab.Ak',
          'Jumadilawal': 'Jum.A',
          'Jumadil Awal': 'Jum.A',
          'Jumadilakhir': 'Jum.Ak',
          'Jumadil Akhir': 'Jum.Ak',
          'Rajab': 'Raj',
          'Syakban': 'Sya',
          'Ramadan': 'Ram',
          'Syawal': 'Syw',
          'Zulkaidah': 'Zul.K',
          'Zulhijah': 'Zul.H',
      };
      
      const shortMonth = abbreviations[month] || month.substring(0, 3);
      return `${parts[0]} ${shortMonth}`;
  }
</script>

<svelte:head>
  <title>Kalender Hijriah - Al-Qur'an App</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-4 pb-24 md:p-8 space-y-6">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <CalendarDays class="text-primary w-5 h-5" />
    </div>
    <div>
      <h1 class="text-2xl font-bold text-foreground">Kalender Hijriah</h1>
      <p class="text-sm text-muted-foreground">Masehi & Hijriah terintegrasi</p>
    </div>
  </div>

  <div class="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 md:px-8 md:py-5 border-b border-border bg-muted/20">
        <button onclick={prevMonth} class="p-2 rounded-xl hover:bg-muted transition-colors active:scale-95" aria-label="Bulan sebelumnya">
            <ChevronLeft class="w-6 h-6 text-foreground" />
        </button>
        <h2 class="text-xl md:text-2xl font-bold text-foreground">{monthName}</h2>
        <button onclick={nextMonth} class="p-2 rounded-xl hover:bg-muted transition-colors active:scale-95" aria-label="Bulan selanjutnya">
            <ChevronRight class="w-6 h-6 text-foreground" />
        </button>
    </div>

    <!-- Calendar Grid -->
    <div class="p-3 md:p-6">
        <div class="grid grid-cols-7 gap-1.5 md:gap-3">
            <!-- Days of Week Header -->
            {#each daysOfWeek as dayName, i}
                <div class="text-center font-bold text-xs md:text-[15px] {i === 6 ? 'text-red-500/80' : 'text-muted-foreground'} py-2 mb-1 md:mb-3">
                    {dayName}
                </div>
            {/each}

            <!-- Days -->
            {#each days as day}
                <div class="
                    relative min-h-[60px] md:min-h-[110px] p-1.5 md:p-3 rounded-xl md:rounded-2xl flex flex-col justify-between border-[1.5px] md:border-2 transition-all
                    {day.isCurrentMonth 
                        ? (day.isToday 
                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                            : 'border-border/50 bg-background hover:border-border hover:bg-muted/30') 
                        : 'border-transparent bg-transparent opacity-30'}
                ">
                    <span class="text-[13px] md:text-xl font-extrabold {day.isToday ? 'text-primary' : (day.date.getDay() === 0 ? 'text-red-500' : 'text-foreground')}">
                        {day.day}
                    </span>
                    
                    <span class="text-[9px] md:text-sm font-semibold leading-none md:leading-tight text-right mt-1 md:mt-2 truncate {day.isToday ? 'text-primary' : 'text-muted-foreground'}">
                        {extractHijriShort(day.hijriDateStr)}
                    </span>
                </div>
            {/each}
        </div>
    </div>
  </div>

  <div class="bg-card/50 rounded-2xl p-4 border border-border text-sm flex gap-3 text-muted-foreground shadow-sm">
    <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Info class="w-3.5 h-3.5 text-primary" />
    </div>
    <p class="leading-relaxed text-[13px]">
        Penanggalan Hijriah telah disinkronkan dengan data kalender <span class="font-bold text-foreground">API MyQuran</span> secara *real-time* untuk memastikan akurasi yang lebih baik (perbedaan ±1 hari mungkin terjadi bergantung pada hasil *rukyatul hilal* atau metode hisab lokal).
    </p>
  </div>
</div>
