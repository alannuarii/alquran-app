<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Masuk - Al-Qur'an Indonesia</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(circle at 20% 80%, black 1px, transparent 1px), radial-gradient(circle at 80% 20%, black 1px, transparent 1px); background-size: 40px 40px;"></div>
	
	<!-- Blur blobs -->
	<div class="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
	<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>

	<div class="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8 relative z-10">
		<div class="flex flex-col items-center text-center space-y-6">
			<!-- Logo -->
			<div class="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-inner">
				<BookOpen class="text-primary w-10 h-10 transform rotate-6" />
			</div>
			
			<div class="space-y-2">
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Al-Qur'an App</h1>
				<p class="text-muted-foreground text-sm leading-relaxed">
					Silakan masuk untuk membaca, melanjutkan progres, dan menyimpan ayat favorit Anda secara sinkron.
				</p>
			</div>

			<div class="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-4"></div>

			<!-- Google Auth Button -->
			<a 
				href="/auth/google" 
				class="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all font-medium group shadow-lg shadow-foreground/10 hover:shadow-foreground/20 hover:-translate-y-0.5"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Lanjutkan dengan Google
			</a>

			<p class="text-xs text-muted-foreground mt-6 text-center max-w-[280px]">
				Aplikasi ini sepenuhnya privat dan hanya dapat diakses melalui Autentikasi Google.
			</p>
		</div>
	</div>
</div>
