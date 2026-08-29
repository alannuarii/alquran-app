<script lang="ts">
	import type { PageProps } from './$types';
	import { Target, Plus, Calendar, BookOpen, CheckCircle2, MoreVertical, LayoutGrid, List } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	
	let { data }: PageProps = $props();
	let plans = $derived(data.plans);
	
	let showNewPlanModal = $state(false);
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Program Khatam - Al-Qur'an Indonesia</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
	
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Program Khatam</h1>
			<p class="text-muted-foreground mt-1">Lacak dan capai target khatam Al-Qur'an Anda</p>
		</div>
		<button 
			onclick={() => showNewPlanModal = true}
			class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
		>
			<Plus size={20} />
			<span>Buat Program Baru</span>
		</button>
	</div>

	<!-- Dashboard Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-card border border-border p-5 rounded-2xl shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<Target size={20} />
				</div>
				<span class="text-2xl font-bold">{plans.length}</span>
			</div>
			<p class="text-sm text-muted-foreground font-medium">Total Program Khatam</p>
		</div>
		
		<div class="bg-card border border-border p-5 rounded-2xl shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<div class="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
					<CheckCircle2 size={20} />
				</div>
				<span class="text-2xl font-bold">{plans.filter(p => p.isCompleted).length}</span>
			</div>
			<p class="text-sm text-muted-foreground font-medium">Program Selesai</p>
		</div>
		
		<div class="bg-card border border-border p-5 rounded-2xl shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
					<BookOpen size={20} />
				</div>
				<span class="text-2xl font-bold">
					{plans.reduce((acc, curr) => acc + curr.totalAyahsRead, 0).toLocaleString('id-ID')}
				</span>
			</div>
			<p class="text-sm text-muted-foreground font-medium">Total Ayat Dibaca (Keseluruhan)</p>
		</div>
	</div>

	<!-- Khatam Plans List -->
	<div class="space-y-4">
		<h2 class="text-xl font-bold">Daftar Program</h2>
		
		{#if plans.length === 0}
			<div class="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
					<Target size={32} />
				</div>
				<h3 class="text-lg font-bold mb-2">Belum Ada Program</h3>
				<p class="text-muted-foreground max-w-md mx-auto mb-6">Mulai perjalanan khatam Anda dengan membuat target bacaan yang terukur dan disiplin.</p>
				<button 
					onclick={() => showNewPlanModal = true}
					class="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium"
				>
					Mulai Sekarang
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each plans as plan}
					<a href="/khatam/{plan.id}" class="block group">
						<div class="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-primary/30 h-full flex flex-col">
							<div class="flex justify-between items-start mb-4">
								<div>
									<h3 class="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{plan.title}</h3>
									<div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
										<Calendar size={14} />
										<span>Target: {new Date(plan.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
									</div>
								</div>
								{#if plan.isCompleted}
									<span class="bg-green-500/10 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">Selesai</span>
								{:else}
									<span class="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">Berjalan</span>
								{/if}
							</div>
							
							<div class="mt-auto space-y-2">
								<div class="flex justify-between text-sm">
									<span class="font-medium">{plan.progressPercentage.toFixed(1)}%</span>
									<span class="text-muted-foreground">{plan.totalAyahsRead.toLocaleString('id-ID')} / 6.236 Ayat</span>
								</div>
								<div class="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
									<div 
										class="h-full {plan.isCompleted ? 'bg-green-500' : 'bg-primary'} rounded-full transition-all duration-1000 ease-out" 
										style="width: {plan.progressPercentage}%"
									></div>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Modal Create Plan -->
{#if showNewPlanModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
		<div class="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold">Program Khatam Baru</h2>
					<button onclick={() => showNewPlanModal = false} class="text-muted-foreground hover:text-foreground">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					</button>
				</div>
				
				<form 
					method="POST" 
					action="?/createPlan" 
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update, result }) => {
							await update();
							isSubmitting = false;
							if (result.type === 'success') {
								showNewPlanModal = false;
							}
						};
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<label for="title" class="text-sm font-medium">Judul Program</label>
						<input 
							type="text" 
							id="title" 
							name="title" 
							placeholder="Contoh: Khatam Ramadhan 1447H" 
							required 
							class="w-full bg-background border border-input rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
						>
					</div>
					
					<div class="space-y-2">
						<label for="targetDate" class="text-sm font-medium">Target Selesai</label>
						<input 
							type="date" 
							id="targetDate" 
							name="targetDate" 
							required 
							min={new Date().toISOString().split('T')[0]}
							class="w-full bg-background border border-input rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
						>
					</div>
					
					<div class="pt-4 flex gap-3">
						<button 
							type="button" 
							onclick={() => showNewPlanModal = false}
							class="flex-1 px-4 py-2.5 rounded-xl border border-input font-medium hover:bg-muted transition-colors"
						>
							Batal
						</button>
						<button 
							type="submit" 
							disabled={isSubmitting}
							class="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center"
						>
							{#if isSubmitting}
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
								Menyimpan...
							{:else}
								Buat Program
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
