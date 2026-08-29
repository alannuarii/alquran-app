<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Compass, MapPin, AlertCircle, Info, Navigation2, Crosshair } from 'lucide-svelte';
  import { calculateQiblaDirection, getShortestRotation, calculateDistance, KAABA_LAT, KAABA_LONG } from '$lib/qibla';

  let latitude = $state<number | null>(null);
  let longitude = $state<number | null>(null);
  let locationName = $state<string>('Sedang mencari...');
  
  let heading = $state<number | null>(null);
  let qiblaAngle = $state<number | null>(null);
  let distance = $state<number | null>(null);
  
  let error = $state<string | null>(null);
  let needsPermission = $state<boolean>(false);
  let compassActive = $state<boolean>(false);
  
  // Smooth rotation states
  let smoothCompassRotation = $state<number>(0);
  let lastCompassRotation = 0;

  let turnAngle = $state<number>(0);
  let turnDirection = $state<'kanan' | 'kiri'>('kanan');
  let isAligned = $state<boolean>(false);

  $effect(() => {
    if (qiblaAngle !== null && heading !== null) {
      // Rotate the compass dial so North always points to actual North
      const targetCompassRotation = -heading;
      smoothCompassRotation = getShortestRotation(lastCompassRotation, targetCompassRotation);
      lastCompassRotation = smoothCompassRotation;

      // Calculate difference for the indicator
      let diff = (qiblaAngle - heading) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;

      isAligned = Math.abs(diff) <= 2; // ±2 degrees tolerance
      turnAngle = Math.round(Math.abs(diff));
      turnDirection = diff > 0 ? 'kanan' : 'kiri';
    }
  });

  async function requestPermission() {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          needsPermission = false;
          startCompass();
        } else {
          error = 'Izin akses sensor kompas ditolak.';
        }
      } catch (err) {
        error = 'Gagal meminta izin sensor kompas.';
      }
    } else {
      needsPermission = false;
      startCompass();
    }
  }

  function startCompass() {
    if ('ondeviceorientationabsolute' in window) {
      (window as any).addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      error = 'Perangkat Anda tidak mendukung sensor kompas.';
      return;
    }
    compassActive = true;
  }

  function handleOrientation(event: any) {
    let newHeading = null;

    if (event.webkitCompassHeading) {
      // iOS gives the heading directly
      newHeading = event.webkitCompassHeading;
    } else if (event.absolute && event.alpha !== null) {
      // Android alpha is counter-clockwise
      newHeading = 360 - event.alpha;
    } else if (event.alpha !== null) {
      newHeading = 360 - event.alpha;
    }

    if (newHeading !== null) {
      heading = newHeading;
    }
  }

  function fetchLocationName(lat: number, lon: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
            const city = data.address.city || data.address.county || data.address.state_district || 'Lokasi Anda';
            locationName = city.toUpperCase();
        }
      })
      .catch(() => {
        locationName = 'Tidak diketahui';
      });
  }

  function getLocation() {
    if (!navigator.geolocation) {
      error = 'Geolokasi tidak didukung oleh browser ini.';
      return;
    }

    // Indicate loading state if retrying
    locationName = 'Sedang mencari...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        qiblaAngle = calculateQiblaDirection(latitude, longitude);
        distance = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LONG);
        fetchLocationName(latitude, longitude);
      },
      (err) => {
        error = 'Gagal mendapatkan lokasi. Pastikan GPS aktif dan diizinkan.';
      },
      { enableHighAccuracy: true }
    );
  }

  onMount(() => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      needsPermission = true;
    } else {
      startCompass();
    }
    getLocation();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      (window as any).removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    }
  });

  function getCardinalDirection(angle: number | null): string {
    if (angle === null) return '';
    const directions = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index];
  }
</script>

<svelte:head>
  <title>Arah Kiblat - Al-Qur'an App</title>
</svelte:head>

<div class="max-w-md mx-auto min-h-screen pb-24 md:p-4">
  
  <!-- Header -->
  <div class="flex items-center p-4">
    <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors text-foreground" onclick={() => history.back()} aria-label="Kembali">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
    <h1 class="text-xl font-bold ml-4 flex-1 text-foreground">Arah Kiblat</h1>
  </div>

  <div class="px-4 space-y-6 mt-2">
    
    <!-- Info Card -->
    <div class="bg-card rounded-3xl p-5 border border-border shadow-sm grid grid-cols-2 gap-4 items-start">
        <div class="space-y-1">
            <p class="text-[11px] text-muted-foreground font-bold tracking-wider">LOKASI SAAT INI</p>
            <div class="flex items-start gap-1.5 pt-0.5">
                <MapPin class="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div class="min-w-0">
                    <p class="font-bold text-sm sm:text-[15px] text-foreground leading-tight truncate">{locationName}</p>
                    <p class="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                        {#if latitude && longitude}
                            {latitude.toFixed(3)}°, {longitude.toFixed(3)}°
                        {:else}
                            --
                        {/if}
                    </p>
                </div>
            </div>
        </div>
        <div class="space-y-1 pl-2 border-l border-border">
            <p class="text-[11px] text-muted-foreground font-bold tracking-wider">SUDUT KIBLAT</p>
            <div class="pt-0.5">
                <p class="font-bold text-primary text-lg sm:text-xl flex items-baseline gap-1 flex-wrap">
                    {qiblaAngle !== null ? qiblaAngle.toFixed(1) + '°' : '--°'} 
                    <span class="text-xs sm:text-sm font-semibold text-muted-foreground">{getCardinalDirection(qiblaAngle)}</span>
                </p>
                <p class="text-[11px] text-muted-foreground mt-1 font-medium truncate">
                    ± {distance !== null ? distance.toLocaleString('id-ID', {maximumFractionDigits: 0}) : '--'} km ke Mekkah
                </p>
            </div>
        </div>
    </div>

    <!-- Direction Indicator -->
    <div class="flex justify-center min-h-[48px]">
      {#if qiblaAngle !== null && heading !== null}
          {#if isAligned}
              <div class="px-8 py-3 rounded-full bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400 font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-pulse">
                  <div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white mr-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  Tepat Menghadap Kiblat! 🕋
              </div>
          {:else}
              <div class="px-8 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center gap-2">
                  <Navigation2 class="w-5 h-5 {turnDirection === 'kanan' ? 'rotate-90' : '-rotate-90'} fill-primary" />
                  Putar ke {turnDirection} {turnAngle}°
              </div>
          {/if}
      {/if}
    </div>

    {#if error}
        <div class="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3">
            <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
            <p class="text-sm font-medium">{error}</p>
        </div>
    {/if}

    {#if needsPermission && !compassActive}
        <div class="flex flex-col items-center justify-center p-8 bg-card rounded-3xl border border-border shadow-sm text-center my-12">
            <Compass class="text-primary w-12 h-12 mb-4" />
            <h3 class="text-lg font-bold mb-2">Akses Kompas Diperlukan</h3>
            <p class="text-muted-foreground text-sm mb-6">
                Untuk menunjukkan arah Kiblat yang akurat, aplikasi memerlukan akses ke sensor kompas Anda.
            </p>
            <button onclick={requestPermission} class="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                Aktifkan Kompas
            </button>
        </div>
    {:else}
        <!-- The Compass Container -->
        <div class="relative mx-auto my-6 select-none pointer-events-none" style="width: 288px; height: 288px;">
            
            <!-- Fixed Top Arrow (Phone orientation) -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
                <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#ef4444]"></div>
            </div>

            <!-- Glow effect when aligned -->
            {#if isAligned}
                <div class="absolute inset-0 bg-[#10b981] rounded-full blur-3xl opacity-20 transition-opacity duration-500"></div>
            {/if}

            <!-- Rotating Compass Dial -->
            <div 
                class="absolute inset-0 rounded-full border-[6px] transition-all duration-300 ease-out shadow-2xl"
                style="transform: rotate({smoothCompassRotation}deg); background-color: #1e2330; border-color: {isAligned ? '#10b981' : '#2a3042'};"
            >
                <!-- Cardinal Ticks -->
                <!-- Note: The letters rotate differently so they stay readable, but in a real compass they rotate with the dial. Let's keep them oriented to the dial to match the reference. -->
                <div class="absolute top-2 left-1/2 -translate-x-1/2 text-[#9ca3af] font-bold text-sm">U</div>
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[#9ca3af] font-bold text-sm rotate-180">S</div>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[#f87171] font-bold text-sm rotate-90">T</div>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] font-bold text-sm -rotate-90">B</div>

                <!-- Minor Ticks -->
                {#each Array(72) as _, i}
                    <div 
                        class="absolute inset-0 flex justify-center pointer-events-none"
                        style="transform: rotate({i * 5}deg);"
                    >
                        <div class="w-[2px] mt-1.5 {i % 18 === 0 ? 'h-0' : i % 2 === 0 ? 'h-2 bg-[#6b7280]/40' : 'h-1 bg-[#6b7280]/20'}"></div>
                    </div>
                {/each}

                <!-- Qibla Marker (inside dial, rotates with it) -->
                {#if qiblaAngle !== null}
                    <div 
                        class="absolute inset-0 z-10 transition-transform duration-500"
                        style="transform: rotate({qiblaAngle}deg);"
                    >
                        <!-- Kiblat Pill -->
                        <div class="absolute top-[14%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#10b981] text-white text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] whitespace-nowrap z-20">
                            <span class="text-base">🕋</span> Kiblat
                        </div>

                        <!-- Arrow head -->
                        <div class="absolute top-[23%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#10b981] z-10"></div>
                        
                        <!-- Marker line -->
                        <div class="absolute top-[23%] left-1/2 -translate-x-1/2 w-1 h-[27%] bg-[#10b981] rounded-full"></div>
                    </div>
                {/if}
            </div>

            <!-- Absolute Center Fixed Display (Shows current heading) -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-lg flex flex-col items-center justify-center z-20" style="width: 80px; height: 80px; background-color: #252b3b; border-color: #31384a;">
                <span class="text-white font-bold text-xl">{heading !== null ? Math.round(heading) : '--'}°</span>
                <span class="text-[9px] font-bold tracking-widest mt-0.5" style="color: #9ca3af;">HADAP</span>
            </div>
            
        </div>
    {/if}

    <!-- Footer Controls -->
    <div class="space-y-4 pt-4">
        <button onclick={getLocation} class="w-full flex items-center justify-center gap-2 py-4 bg-card border border-border rounded-2xl font-bold text-foreground hover:bg-muted transition-colors shadow-sm active:scale-[0.98]">
            <Crosshair class="w-5 h-5 text-muted-foreground" />
            Perbarui Akurasi GPS
        </button>

        <div class="bg-card rounded-2xl p-4 border border-border text-sm flex gap-3 text-muted-foreground shadow-sm">
            <div class="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Info class="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p class="leading-relaxed text-[13px]">
                <span class="font-bold text-foreground">Panduan Penggunaan:</span> Letakkan perangkat mendatar (sejajar lantai). Jika arah terasa kurang akurat, gerakkan perangkat membentuk angka <b>8</b> di udara untuk kalibrasi kompas.
            </p>
        </div>
    </div>

  </div>
</div>
