/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                green: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    500: '#22c55e', // Use standard green for utility
                    600: '#16a34a',
                },
                brand: {
                    green: '#28A745', // Official Loomly Green
                    teal: '#14b8a6',
                    purple: '#a855f7',
                },
                slate: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                }
            },
            fontFamily: {
                'sans': ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
                'display': ['Outfit', 'Inter', 'sans-serif'],
            },
            borderRadius: {
                'lg': '1rem',
                'xl': '1.5rem',
                '2xl': '2rem',
                '3xl': '2.5rem',
            },
        },
    },
    plugins: [],
}
