import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    safelist: ['dark'],
    prefix: '',
    corePlugins: {
        container: false,
    },
    theme: {
        screens: {
            xs: { min: '0px', max: '1023px' },
            sm: { min: '1024px', max: '1365px' },
            md: { min: '1366px', max: '1679px' },
            lg: { min: '1680px', max: '1919px' },
            xl: { min: '1920px' },
        },
        extend: {
            colors: {
                '3ace01': '#3ace01',
                ffd5bd: '#ffd5bd',
                '9ee4e8': '#9ee4e8',
                eefbfc: '#eefbfc',
                '70be20': '#70be20',
                '78269f': '#78269f',
                '7edbe7': '#7edbe7',
                ffd55f: '#ffd55f',
                b8d3ff: '#b8d3ff',
                e6f9fa: '#E6F9FA',
                996923: '#996923',
                ff7800: '#ff7800',
                ea475b: '#ea475b',
                '00afb8': '#00afb8',
                '1654b9': '#1654b9',
                ffC31B: '#ffC31B',
                '6fb827': '#6fb827',
                '8a57a2': '#8a57a2',
                ffeedf: '#ffeedf',
                scrollbar: 'var(--scrollbar)',
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
            },
            fontSize: {
                h1: '36px',
                '3xl': '28px',
            },
            transitionDuration: {
                default: 'var(--tmd--transition-duration)',
            },
            keyframes: {
                'collapsible-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-collapsible-content-height)' },
                },
                'collapsible-up': {
                    from: { height: 'var(--radix-collapsible-content-height)' },
                    to: { height: 0 },
                },
            },
            animation: {
                'collapsible-down': 'collapsible-down 0.2s ease-in-out',
                'collapsible-up': 'collapsible-up 0.2s ease-in-out',
            },
        },
    },
    plugins: [
        animate,
        function ({ addComponents }) {
            addComponents({
                '.container': {
                    maxWidth: '100%',
                    'margin-right': 'auto',
                    'margin-left': 'auto',
                    '@screen xs': {
                        maxWidth: '100%',
                    },
                    '@screen sm': {
                        maxWidth: '960px',
                    },
                    '@screen md': {
                        maxWidth: '1200px',
                    },
                    '@screen lg': {
                        maxWidth: '1440px',
                    },
                    '@screen xl': {
                        maxWidth: '1800px',
                    },
                },
            })
        },
    ],
}
