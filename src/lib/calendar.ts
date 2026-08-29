export interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hijriDateStr: string;
}

export function generateCalendarDays(year: number, month: number, hijriOffset: number = 0): CalendarDay[] {
    const days: CalendarDay[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    // Start calendar on Monday
    let startDayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const endDate = new Date(lastDay);
    let endDayOfWeek = endDate.getDay() === 0 ? 6 : endDate.getDay() - 1;
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    // Ensure 6 rows (42 days) to keep grid size consistent
    while (Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) < 41) {
        endDate.setDate(endDate.getDate() + 7);
    }

    const currentDate = new Date(startDate);
    const today = new Date();

    const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    while (currentDate <= endDate) {
        // Apply offline offset
        const hijriCalcDate = new Date(currentDate);
        hijriCalcDate.setDate(hijriCalcDate.getDate() + hijriOffset);
        
        let hijriStr = hijriFormatter.format(hijriCalcDate);
        hijriStr = hijriStr.replace(' H', '');

        days.push({
            date: new Date(currentDate),
            day: currentDate.getDate(),
            isCurrentMonth: currentDate.getMonth() === month,
            isToday: currentDate.toDateString() === today.toDateString(),
            hijriDateStr: hijriStr
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
}

export async function fetchHijriOffset(): Promise<number> {
    try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        const res = await fetch(`https://api.myquran.com/v2/cal/hijr/${yyyy}-${mm}-${dd}`);
        const data = await res.json();
        
        if (data && data.status && data.data && data.data.date) {
            // API returns ["Sabtu", "15 Rabiul Awal 1448 H", "29-08-2026"]
            const apiHijriStr = data.data.date[1]; 
            const apiDayMatch = apiHijriStr.match(/^(\d+)/);
            if (!apiDayMatch) return 0;
            const apiDay = parseInt(apiDayMatch[1]);
            
            const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', { day: 'numeric' });
            const jsHijriStr = hijriFormatter.format(today);
            const jsDay = parseInt(jsHijriStr);
            
            let offset = apiDay - jsDay;
            if (Math.abs(offset) > 15) {
                if (offset < -15) offset += 30;
                else if (offset > 15) offset -= 30;
            }
            
            return Math.max(-2, Math.min(2, offset)); // Realistic limits
        }
    } catch (e) {
        console.error("Failed to fetch Hijri offset", e);
    }
    return 0;
}
