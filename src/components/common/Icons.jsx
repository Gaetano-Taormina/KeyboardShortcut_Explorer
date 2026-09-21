import { memo } from 'react';

export const PinIcon = memo(function PinIcon({ active, size = 14 }) {
    if (active) {
        return (
            <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M11 6.31V7H2v-.69L4.12 4.19V1h4.76v3.19L11 6.31zM6 14.5v-6.62h1v6.62l-.5.5-.5-.5z"/>
            </svg>
        );
    }
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M11.16 6.31l-.22-.3-2.61-2.6L8 3.19V1L7.5.5h-2L5 1v2.19l-.31.22-2.6 2.6-.21.31v1.64h3.62v6.62L6 15h1l.5-.5.5.5h1l.5-.5v-6.62h3.66V6.31zm-1 .69H3V6l2.12-2.12V1h2.76v2.88L10.16 6v1z"/>
        </svg>
    );
});

export const CheckIcon = memo(function CheckIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z" />
        </svg>
    );
});
