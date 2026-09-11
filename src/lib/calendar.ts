export interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hijriDateStr: string;
}

export const HIJRI_MONTHS = [
    'Muharram',
    'Safar',
    'Rabiul Awal',
    'Rabiul Akhir',
    'Jumadil Awal',
    'Jumadil Akhir',
    'Rajab',
    "Sya'ban",
    'Ramadhan',
    'Syawal',
    "Dzulqa'dah",
    'Dzulhijjah'
];

/**
 * Fallback algorithm (Kuwaiti algorithm) for Islamic calendar conversion
 */
function kuwaitiAlgorithm(date: Date): { day: number; month: number; year: number } {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    let m = month + 1;
    let y = year;
    if (m < 3) {
        y -= 1;
        m += 12;
    }

    const a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (y < 1583) b = 0;
    if (y === 1582) {
        if (m > 10) b = -10;
        if (m === 10) {
            b = 0;
            if (day > 4) b = -10;
        }
    }

    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
    const epochastro = 1948084;
    const iyear = 10631 / 30;
    const shift1 = 8.01 / 60;

    const z = jd - epochastro;
    const cyc = Math.floor(z / 10631);
    const zRemaining = z - 10631 * cyc;
    const j = Math.floor((zRemaining - shift1) / iyear);
    const iy = 30 * cyc + j;
    const z2 = zRemaining - Math.floor(j * iyear + shift1);
    let im = Math.floor((z2 + 28.5001) / 29.5);
    if (im === 13) im = 12;
    const id = z2 - Math.floor(29.5001 * im - 29);

    return { day: id, month: im, year: iy };
}

/**
 * Extracts numeric day, month (1-12), and year in Hijri calendar reliably across all platforms/browsers
 */
export function getHijriParts(date: Date, offset: number = 0): { day: number; month: number; year: number } {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);

    const locales = [
        'en-u-ca-islamic-umalqura-nu-latn',
        'en-u-ca-islamic-nu-latn',
        'en-u-ca-islamic-civil-nu-latn'
    ];

    for (const loc of locales) {
        try {
            const f = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'numeric', year: 'numeric' });
            const resolvedCal = f.resolvedOptions().calendar;
            if (resolvedCal && resolvedCal.includes('islamic')) {
                const parts = f.formatToParts(d);
                let day = 0;
                let month = 0;
                let year = 0;
                for (const p of parts) {
                    if (p.type === 'day') day = parseInt(p.value, 10);
                    if (p.type === 'month') month = parseInt(p.value, 10);
                    if (p.type === 'year') year = parseInt(p.value, 10);
                }
                if (day && month >= 1 && month <= 12 && year >= 1300 && year <= 1600) {
                    return { day, month, year };
                }
            }
        } catch {}
    }

    return kuwaitiAlgorithm(d);
}

/**
 * Formats a date into a localized Indonesian Hijri date string.
 * Prevents mobile ICU bugs that format Islamic months using Gregorian names (e.g. 'Maret' instead of 'Rabiul Awal' and 'SM' instead of 'H').
 */
export function formatHijriDate(date: Date, offset: number = 0, includeYear: boolean = true): string {
    const parts = getHijriParts(date, offset);
    const monthName = HIJRI_MONTHS[parts.month - 1] || '';
    if (!includeYear) {
        return `${parts.day} ${monthName}`;
    }
    return `${parts.day} ${monthName} ${parts.year} H`;
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

    while (currentDate <= endDate) {
        const hijriStr = formatHijriDate(currentDate, hijriOffset, false);

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
            
            const jsParts = getHijriParts(today, 0);
            const jsDay = jsParts.day;
            
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
